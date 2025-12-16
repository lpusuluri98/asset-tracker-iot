#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <secrets.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#define PIR_PIN 13
#define UUID_LENGTH 36
#define ROOM_NAME_LENGTH 20
#define BLE_SCAN_DURATION 5
#define BLE_SCAN_INTERVAL 2000
#define BLE_SCAN_WINDOW 500
#define MQTT_PUBLISH_INTERVAL 10000

void vBLEScanTask(void *pvParameters);
void vPIRTask(void *pvParameters);
void vSendDataTask(void *pvParameters);
void vMqttTask(void* pvParameters);

static SemaphoreHandle_t scannerMutex;
static SemaphoreHandle_t uuidMutex;
static SemaphoreHandle_t roomMutex;

struct ScannerData {
  bool motionDetected = false;
  int latestRSSI = -100;
};

static ScannerData scannerData;
StaticJsonDocument<50> payload;
StaticJsonDocument<600> uuid_payload;
WiFiClientSecure net;
PubSubClient mqttClient(net);
char targetUUID[UUID_LENGTH + 1] = {0};
char roomName[ROOM_NAME_LENGTH + 1] = {0};
bool firstRun = true;
unsigned long lastPublishTime = 0;
TaskHandle_t bleTaskHandle = NULL;


void setup() {
  Serial.begin(115200);
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  Serial.println("System started");
  
  scannerMutex = xSemaphoreCreateMutex();
  uuidMutex = xSemaphoreCreateMutex();
  
  if (scannerMutex == NULL || uuidMutex == NULL) {
    Serial.println("ERROR: Failed to create semaphores");
    while(1) vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
  
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);
  mqttClient.setClient(net);
  pinMode(PIR_PIN, INPUT);
  
  if (xTaskCreatePinnedToCore(vBLEScanTask, "BLE Scan Task", 2248, NULL, 1, &bleTaskHandle, 0) != pdPASS) {
    Serial.println("ERROR: Failed to create BLE Scan task");
  }
  
  if (xTaskCreatePinnedToCore(vMqttTask, "MQTT Task", 4096, NULL, 1, NULL, 1) != pdPASS) {
    Serial.println("ERROR: Failed to create MQTT task");
  }
  
  if (xTaskCreatePinnedToCore(vPIRTask, "PIR Task", 1024, NULL, 2, NULL, 1) != pdPASS) {
    Serial.println("ERROR: Failed to create PIR task");
  }
  
  if (xTaskCreatePinnedToCore(vSendDataTask, "Send Data Task", 1024, NULL, 1, NULL, 1) != pdPASS) {
    Serial.println("ERROR: Failed to create Send Data task");
  }

  vTaskDelete(NULL);
}

void loop() {
  // put your main code here, to run repeatedly:
}
void vPIRTask(void *pvParameters){
  bool motionState = LOW;
  for(;;){
    motionState = (bool)digitalRead(PIR_PIN);
    if(xSemaphoreTake(scannerMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      scannerData.motionDetected = motionState;
      xSemaphoreGive(scannerMutex);
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}

void vSendDataTask(void *pvParameters) {
  for(;;){
    bool motion = false;
    int rssi = -100;
    if(xSemaphoreTake(scannerMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      motion = scannerData.motionDetected;
      rssi = scannerData.latestRSSI;
      xSemaphoreGive(scannerMutex);
    }
    Serial.print("Motion: ");
    Serial.print(motion ? "Yes" : "No");
    Serial.print(" | RSSI: ");
    Serial.println(rssi);
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
}

class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice){
    char UUID[UUID_LENGTH + 1] = {0};
    if(xSemaphoreTake(uuidMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
      strncpy(UUID, targetUUID, UUID_LENGTH);
      UUID[UUID_LENGTH] = '\0';
      xSemaphoreGive(uuidMutex);
    }
    if(UUID[0] == '\0') {
      return;
    }
    if(advertisedDevice.haveServiceUUID() && advertisedDevice.getServiceUUID().toString() == UUID) {
      int rssi = advertisedDevice.getRSSI();
      if(xSemaphoreTake(scannerMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
        scannerData.latestRSSI = rssi;
        xSemaphoreGive(scannerMutex);
      }
      Serial.println("Found matching device");
    }
  }
};

void vBLEScanTask(void *pvParameters) {
  BLEDevice::init("Scanner_02");
  BLEScan* pBLEScan = BLEDevice::getScan();
  MyAdvertisedDeviceCallbacks callback;
  pBLEScan->setAdvertisedDeviceCallbacks(&callback);
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(BLE_SCAN_INTERVAL);
  pBLEScan->setWindow(BLE_SCAN_WINDOW);
  
  ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
  
  for(;;){
    pBLEScan->start(BLE_SCAN_DURATION, false);
    pBLEScan->clearResults();
    vTaskDelay(3000 / portTICK_PERIOD_MS);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  const char* newUUID = NULL;
  const char* newRooom = NULL;
  if(strcmp(topic, SHADOW_GET_ACCEPTED_TOPIC) == 0) {
    deserializeJson(uuid_payload, payload, length);
    newUUID = uuid_payload["state"]["desired"]["targetUUID"];
    newRooom = uuid_payload["state"]["desired"]["roomName"];
  }
  else if(strcmp(topic, SHADOW_DELTA_TOPIC) == 0) {
    deserializeJson(uuid_payload, payload, length);
    //To do: Handle if no targetUUID or roomName is set in the delta
    newUUID = uuid_payload["state"]["targetUUID"];
    newRooom = uuid_payload["state"]["roomName"];
  }
  if(newRooom){
    if(xSemaphoreTake(roomMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      strncpy(roomName, newRooom, ROOM_NAME_LENGTH);
      roomName[ROOM_NAME_LENGTH] = '\0';
      xSemaphoreGive(roomMutex);
    }
    if(roomName[0] != '\0') {
    Serial.print("Room name updated: ");
    Serial.println(roomName);
    }
  }

  if(newUUID){
    if(xSemaphoreTake(uuidMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      strncpy(targetUUID, newUUID, UUID_LENGTH);
      targetUUID[UUID_LENGTH] = '\0';
      xSemaphoreGive(uuidMutex);
    }
    if(targetUUID[0] != '\0') {
      Serial.print("Target UUID updated: ");
      Serial.println(targetUUID);
      if(bleTaskHandle != NULL){
        xTaskNotifyGive(bleTaskHandle);
      }
    }
  }
  
  char message[128];
  snprintf(message, sizeof(message), "{\"state\":{\"reported\":{\"targetUUID\":\"%s\",\"roomName\":\"%s\"}}}", targetUUID, roomName);
  mqttClient.publish(SHADOW_UPDATE_TOPIC, message);
}


void vMqttTask(void* pvParameters) {
  char currentTarget[UUID_LENGTH + 1] = {0};
  
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    Serial.print(".");
    vTaskDelay(500 / portTICK_PERIOD_MS);
    timeout++;
  }
  Serial.println("WiFi connected");
  
  mqttClient.setServer(MQTT_HOST, 8883);
  mqttClient.setCallback(mqttCallback);
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  
  for(;;){
    if(WiFi.status() != WL_CONNECTED) {
      WiFi.reconnect();
      vTaskDelay(2000 / portTICK_PERIOD_MS);
      continue;
    }
    
    if(!mqttClient.connected()) {
      if(!mqttClient.connect("Scanner_02")) {
        Serial.println("MQTT connection failed");
        vTaskDelay(2000 / portTICK_PERIOD_MS);
        continue;
      }
      Serial.println("MQTT connected");
      mqttClient.subscribe(SHADOW_GET_ACCEPTED_TOPIC);
      mqttClient.subscribe(SHADOW_DELTA_TOPIC);
    }
    
    mqttClient.loop();
    
    unsigned long now = millis();
    if(firstRun) {
      mqttClient.publish(SHADOW_GET_TOPIC, "{}");
      firstRun = false;
    }
    
    if(now - lastPublishTime > MQTT_PUBLISH_INTERVAL) {
      int rssi = -100;
      bool motion = false;
      
      if(xSemaphoreTake(scannerMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
        rssi = scannerData.latestRSSI;
        motion = scannerData.motionDetected;
        xSemaphoreGive(scannerMutex);
      }
      
      if(xSemaphoreTake(uuidMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
        strncpy(currentTarget, targetUUID, UUID_LENGTH);
        currentTarget[UUID_LENGTH] = '\0';
        xSemaphoreGive(uuidMutex);
      }
      
      payload.clear();
      payload["assetID"] = currentTarget;
      payload["motionDetected"] = motion;
      payload["latestRSSI"] = rssi;
      
      char buffer[128];
      serializeJson(payload, buffer, sizeof(buffer));
      char topic[128] = "iot/";
      strncat(topic, roomName, sizeof(topic) - strlen(topic) - 1);
      strncat(topic, "/data", sizeof(topic) - strlen(topic) - 1);
      mqttClient.publish(topic, buffer);
      lastPublishTime = now;
    }
    
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}
// put function definitions here:

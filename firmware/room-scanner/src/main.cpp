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
#define SCANNER "Scanner_02"

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
StaticJsonDocument<1024> uuid_payload;
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
  roomMutex = xSemaphoreCreateMutex();
  
  if (scannerMutex == NULL || uuidMutex == NULL || roomMutex == NULL) {
    Serial.println("ERROR: Failed to create semaphores");
    while(1) vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
  
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);
  mqttClient.setClient(net);
  mqttClient.setBufferSize(4096);
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
  Serial.println("Starting BLE scan task");
  
  // Wait for MQTT connection before initializing BLE to conserve memory
  ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
  Serial.println("MQTT connected, initializing BLE...");
  
  BLEDevice::init(SCANNER);
  BLEScan* pBLEScan = BLEDevice::getScan();
  MyAdvertisedDeviceCallbacks callback;
  pBLEScan->setAdvertisedDeviceCallbacks(&callback);
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(BLE_SCAN_INTERVAL);
  pBLEScan->setWindow(BLE_SCAN_WINDOW);
  
  for(;;){
    pBLEScan->start(BLE_SCAN_DURATION, false);
    pBLEScan->clearResults();
    vTaskDelay(3000 / portTICK_PERIOD_MS);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println("");
  Serial.print(">>> MQTT CALLBACK TRIGGERED! Topic: ");
  Serial.println(topic);
  Serial.print("Payload length: ");
  Serial.println(length);
  
  // Print raw payload
  // Serial.print("Raw Payload: ");
  // for (unsigned int i = 0; i < length; i++) {
  //   Serial.print((char)payload[i]);
  // }
  // Serial.println("");

  // Deserialize JSON once
  DeserializationError error = deserializeJson(uuid_payload, payload, length);
  
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  Serial.println("Parsed JSON successfully:");
  serializeJsonPretty(uuid_payload, Serial);
  
  const char* newUUID = NULL;
  const char* newRoom = NULL;
  
  if(strcmp(topic, SHADOW_GET_ACCEPTED_TOPIC) == 0) {
    Serial.println("Processing SHADOW_GET_ACCEPTED_TOPIC");
    if(uuid_payload["state"]["desired"].containsKey("targetUUID")) {
      newUUID = uuid_payload["state"]["desired"]["targetUUID"];
    }
    if(uuid_payload["state"]["desired"].containsKey("roomName")) {
      newRoom = uuid_payload["state"]["desired"]["roomName"];
    }
  }
  else if(strcmp(topic, SHADOW_DELTA_TOPIC) == 0) {
    Serial.println("Processing SHADOW_DELTA_TOPIC");
    if(uuid_payload["state"].containsKey("targetUUID")) {
      newUUID = uuid_payload["state"]["targetUUID"];
    }
    if(uuid_payload["state"].containsKey("roomName")) {
      newRoom = uuid_payload["state"]["roomName"];
    }
  }
  else {
    Serial.print("Unknown topic received: ");
    Serial.println(topic);
    return;
  }
  
  // Only process if we got actual updates
  if(newRoom == NULL && newUUID == NULL) {
    Serial.println("No targetUUID or roomName in delta, ignoring");
    return;
  }

  if(newRoom){
    if(xSemaphoreTake(roomMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      strncpy(roomName, newRoom, ROOM_NAME_LENGTH);
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
  char currentRoom[ROOM_NAME_LENGTH + 1] = {0};
  
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    Serial.print(".");
    vTaskDelay(500 / portTICK_PERIOD_MS);
    timeout++;
  }
  Serial.println("WiFi connected");
  mqttClient.setBufferSize(2048);

  mqttClient.setServer(MQTT_HOST, 8883);
  mqttClient.setCallback(mqttCallback);
  Serial.println("MQTT Callback registered");
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  
  for(;;){
    if(WiFi.status() != WL_CONNECTED) {
      WiFi.reconnect();
      vTaskDelay(2000 / portTICK_PERIOD_MS);
      firstRun = true;
      continue;
    }
    
    if(!mqttClient.connected()) {
      Serial.println("Attempting MQTT connection...");
      
      // Set a connection timeout of 5 seconds
      net.setTimeout(5000);
      
      bool connectResult = mqttClient.connect(SCANNER);
      
      if(!connectResult) {
        Serial.println("MQTT connection failed");
        vTaskDelay(2000 / portTICK_PERIOD_MS);
        continue;
      }
      Serial.println("MQTT connected successfully");
      
      // Subscribe to shadow topics
      mqttClient.subscribe(SHADOW_GET_ACCEPTED_TOPIC);
      mqttClient.subscribe(SHADOW_DELTA_TOPIC);
      
      // Call loop to process subscriptions
      for(int i = 0; i < 5; i++) {
        mqttClient.loop();
        vTaskDelay(100 / portTICK_PERIOD_MS);
      }
      firstRun = true;
    }
    
    // Call loop frequently to receive messages
    mqttClient.loop();
    
    unsigned long now = millis();
    if(firstRun && mqttClient.connected()) {
      Serial.println("Publishing SHADOW_GET_TOPIC request...");
      mqttClient.publish(SHADOW_GET_TOPIC, "{}");
      firstRun = false;
    }
    
    mqttClient.loop();
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
      if(xSemaphoreTake(roomMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
        strncpy(currentRoom, roomName, ROOM_NAME_LENGTH);
        currentRoom[ROOM_NAME_LENGTH] = '\0';
        xSemaphoreGive(roomMutex);
      }
      
      payload.clear();
      payload["assetID"] = currentTarget;
      payload["motionDetected"] = motion;
      payload["latestRSSI"] = rssi;
      
      char buffer[128];
      serializeJson(payload, buffer, sizeof(buffer));
      char topic[128] = "iot/";
      if(currentRoom[0] == '\0') {
        strcpy(currentRoom, "office");
      }
      snprintf(topic, sizeof(topic), "iot/%s/data", currentRoom);
      mqttClient.publish(topic, buffer);
      lastPublishTime = now;
    }
    
    vTaskDelay(100 / portTICK_PERIOD_MS);
  }
}
// put function definitions here:

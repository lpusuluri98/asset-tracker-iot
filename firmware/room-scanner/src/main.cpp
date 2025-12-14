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

#define pirPin 13
// #define UUID "12345678-1234-1234-1234-1234567890ab"
// put function declarations here:
void vBLEScanTask(void *pvParameters);
void vPIRTask(void *pvParameters);
void vSendDataTask(void *pvParameters);
void vMqttTask(void* pvParameters);
static SemaphoreHandle_t scannerMutex;
static SemaphoreHandle_t uuidMutex;
struct ScannerData {
  bool motionDetected = false;
  int latestRSSI = -100;
};
static ScannerData scannerData;
StaticJsonDocument<50> payload;
StaticJsonDocument<600> uuid_payload;
WiFiClientSecure net;
PubSubClient mqttClient(net);
char targetUUID[37] = {0};
bool firstRun = true;
unsigned long lastPublishTime = 0;
TaskHandle_t bleTaskHandle = NULL;


void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  Serial.println("Serial monitor started");
  scannerMutex = xSemaphoreCreateMutex();
  uuidMutex = xSemaphoreCreateMutex();
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);
  mqttClient.setClient(net);
  pinMode(pirPin, INPUT); //PIR Sensor pin
  xTaskCreatePinnedToCore(
      vBLEScanTask,        // Task function
      "BLE Scan Task",    // Name of the task
      2248,               // Stack size (bytes)
      NULL,               // Parameter to pass
      1,                  // Task priority
      &bleTaskHandle,               // Task handle
      0); 
  
      xTaskCreatePinnedToCore(
      vMqttTask,      // Task function 
      "MQTT Task",   // Name of the task
      4096,               // Stack size (bytes)
      NULL,               // Parameter to pass
      1,                  // Task priority
      NULL,               // Task handle
      1);            // Core where the task should run
                  // Core where the task should run
  
  xTaskCreatePinnedToCore(
      vPIRTask,           // Task function 
      "PIR Task",        // Name of the task
      1024,               // Stack size (bytes)
      NULL,               // Parameter to pass
      1,                  // Task priority
      NULL,               // Task handle
      1);                 // Core where the task should run
  xTaskCreatePinnedToCore(
      vSendDataTask,      // Task function 
      "Send Data Task",   // Name of the task
      1024,               // Stack size (bytes)
      NULL,               // Parameter to pass
      1,                  // Task priority
      NULL,               // Task handle
      1);                 // Core where the task should run
  

       // Delete the setup and loop task
  vTaskDelete(NULL);
}

void loop() {
  // put your main code here, to run repeatedly:
}
void vPIRTask(void *pvParameters){
  bool motionState = LOW;
  for(;;){
    motionState = (bool)digitalRead(pirPin);
    if(xSemaphoreTake(scannerMutex, portMAX_DELAY) == pdTRUE) {
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
    if(xSemaphoreTake(scannerMutex, portMAX_DELAY) == pdTRUE) {
      motion = scannerData.motionDetected;
      rssi = scannerData.latestRSSI;
      xSemaphoreGive(scannerMutex);
    }
    Serial.print("Motion Detected: ");
    Serial.print(motion ? "Yes" : "No");
    Serial.print(" | Latest RSSI: ");
    Serial.println(rssi);
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
}

class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice){
    char UUID[37] = {0};
    if(xSemaphoreTake(uuidMutex, portMAX_DELAY) == pdTRUE) {
      strncpy(UUID, targetUUID, 36);
      UUID[36] = '\0';
      xSemaphoreGive(uuidMutex);
    }
    if(UUID[0] == '\0') {
      return; // No target UUID set
    }
    if(advertisedDevice.haveServiceUUID() && advertisedDevice.getServiceUUID().toString() == UUID) {
      int rssi = advertisedDevice.getRSSI();
      if(xSemaphoreTake(scannerMutex, portMAX_DELAY) == pdTRUE) {
        scannerData.latestRSSI = rssi;
        xSemaphoreGive(scannerMutex);
      }
      // Only log device info occasionally to reduce memory pressure
      Serial.println("Found matching device");
    }
  }
};

void vBLEScanTask(void *pvParameters) {
  BLEDevice::init("Scanner_02");
  BLEScan* pBLEScan = BLEDevice::getScan();
  MyAdvertisedDeviceCallbacks callback;  // Create once, reuse
  pBLEScan->setAdvertisedDeviceCallbacks(&callback);
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(2000);
  pBLEScan->setWindow(500);  // less or equal setInterval value
  ulTaskNotifyTake(pdTRUE, portMAX_DELAY); // Wait until notified to start scanning
  for(;;){
    pBLEScan->start(5, false);  // REDUCED scan time from 5 to 3 seconds
    pBLEScan->clearResults();   // delete results fromBLEScan buffer to release memory
    // Serial.print("BLE: Free heap: ");
    // Serial.println(xPortGetFreeHeapSize());
    vTaskDelay(3000 / portTICK_PERIOD_MS);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  const char* newUUID = NULL;
  Serial.print("mqttCallback called for topic: ");
  if(strcmp(topic, SHADOW_GET_ACCEPTED_TOPIC) == 0) {
    deserializeJson(uuid_payload, payload, length);
    newUUID = uuid_payload["state"]["desired"]["targetUUID"];
    Serial.println("Processing shadow get accepted message: ");
    Serial.println(newUUID);
    // strncpy(targetUUID, uuid_payload["state"]["desired"]["targetUUID"], 36);
  }
  else if(strcmp(topic, SHADOW_DELTA_TOPIC) == 0) {
    Serial.println("Processing shadow delta message");
    // char buff[50];
    deserializeJson(uuid_payload, payload, length);
    newUUID = uuid_payload["state"]["targetUUID"];
    Serial.println(newUUID);
    }
  if(newUUID){
    if(xSemaphoreTake(uuidMutex, portMAX_DELAY) == pdTRUE) {
      strncpy(targetUUID, newUUID, 36);
      targetUUID[36] = '\0';
      xSemaphoreGive(uuidMutex);
    }
    if(targetUUID[0] != '\0') {
      Serial.print("Updated target UUID to: ");
      Serial.println(targetUUID);
      if(bleTaskHandle == NULL){
        vTaskDelay(1000 / portTICK_PERIOD_MS); // Short delay to ensure BLE task handle is valid        
      }
      xTaskNotifyGive(bleTaskHandle);
       // Notify BLE task to start scanning
    }
  }
  // Use char buffer instead of String to save memory
  char message[128];
  snprintf(message, sizeof(message), "{\"state\":{\"reported\":{\"targetUUID\":\"%s\"}}}", targetUUID);
  mqttClient.publish(SHADOW_UPDATE_TOPIC, message);

}


void vMqttTask(void* pvParameters) {
  // MQTT task implementation
  char currentTarget[37] = {0};
  // Serial.print("MQTT: Free heap at start: ");
  // Serial.println(xPortGetFreeHeapSize());
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
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  
  uint32_t lastPublish = 0;
  
  for(;;){
    if(WiFi.status() != WL_CONNECTED) {
      WiFi.reconnect();
      vTaskDelay(2000 / portTICK_PERIOD_MS);
      continue;
    }
    
    if(!mqttClient.connected()) {
      mqttClient.connect("Scanner_02");
      if(mqttClient.state()!=MQTT_CONNECTED) {
        Serial.println("MQTT connection failed");
        // Connected
      }
      else{
        Serial.println("Topic subscribed"); // Request current shadow state
        mqttClient.setCallback(mqttCallback);  // <-- SET CALLBACK HERE after successful connection
        mqttClient.subscribe(SHADOW_GET_ACCEPTED_TOPIC);
        mqttClient.subscribe(SHADOW_DELTA_TOPIC);
      }
    }
    
     mqttClient.loop();
    if(mqttClient.connected()) {
      int rssi;
      bool motion;
      unsigned long now = millis();
      //mqttClient.loop();
      
      if(firstRun) {
        mqttClient.publish(SHADOW_GET_TOPIC,"{}");
        firstRun = false;
      }
      if(now - lastPublishTime > 10000) {
        if(xSemaphoreTake(scannerMutex, portMAX_DELAY) == pdTRUE) {
          // Prepare and publish MQTT message with scannerData
          rssi = scannerData.latestRSSI;
          motion = scannerData.motionDetected;
          xSemaphoreGive(scannerMutex);
        }
        if(xSemaphoreTake(uuidMutex, portMAX_DELAY) == pdTRUE) {
          strncpy(currentTarget, targetUUID, 36);
          currentTarget[36] = '\0';
          xSemaphoreGive(uuidMutex);
        }
        payload["assetID"] = currentTarget;
        payload["motionDetected"] = motion;
        payload["latestRSSI"] = rssi;
        char buffer[70];
        serializeJson(payload, buffer, sizeof(buffer));
        Serial.println(buffer);
        mqttClient.publish("iot/livingroom/data", buffer);
        lastPublishTime = now;
      } 
    }
    vTaskDelay(100 / portTICK_PERIOD_MS);  // SHORTER loop delay
  }
}
// put function definitions here:

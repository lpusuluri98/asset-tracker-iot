#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLEBeacon.h>
// put function declarations here:
void vBeaconTask(void *pvParameters);

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  Serial.println("Serial monitor started");
  xTaskCreatePinnedToCore(
      vBeaconTask,          // Task function
      "Beacon Task",       // Name of the task
      4096,                // Stack size (bytes)
      NULL,                // Parameter to pass
      1,                   // Task priority
      NULL,                // Task handle
      1);                  // Core where the task should run

       // Delete the setup and loop task
}

void loop() {
  // put your main code here, to run repeatedly:
  vTaskDelete(NULL);
}

// put function definitions here:
void vBeaconTask(void *pvParameters) {
  BLEDevice::init("Device1_Beacon");
  BLEDevice::createServer();
  BLEBeacon oBeacon = BLEBeacon();
  BLEUUID UUID = BLEUUID("594c9b7c-8a1e-4c4b-986c-5877365d0d46");
  UUID = UUID.to128();
  oBeacon.setManufacturerId(0x4C00); // Apple
  oBeacon.setProximityUUID(BLEUUID(UUID.getNative()->uuid.uuid128,16,true));
  Serial.print("UUID: ");
  Serial.println(oBeacon.getProximityUUID().toString().c_str());
  oBeacon.setMajor(1);
  oBeacon.setMinor(1);
  oBeacon.setSignalPower(-59);

  std::string blePacket = "";
  blePacket += (char)(oBeacon.getData().length()+1); //Length of the packet
  blePacket += (char)0xFF; // Manufacturer specific data
  blePacket += oBeacon.getData(); //Payload

  BLEAdvertisementData advertisementData = BLEAdvertisementData();
  advertisementData.setFlags(0x04); // Flags for General Discovery, No Classic BT
  advertisementData.addData(blePacket); // Add the beacon data
  BLEDevice::getAdvertising()->setAdvertisementData(advertisementData);
  BLEDevice::getAdvertising()->start();

  for(;;){
    Serial.println("Beacon Task is running");
    vTaskDelay(2000 / portTICK_PERIOD_MS);
  }
  
}
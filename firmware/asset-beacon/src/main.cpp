#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLEBeacon.h>

// ============================================================================
// BLE Beacon Configuration Constants
// ============================================================================

// Device and BLE advertising settings
#define DEVICE_NAME                "Device1_Beacon"
#define BLE_TX_POWER              -59    // TX power in dBm (valid range: -27 to 7)
#define BLE_MANUFACTURER_ID        0x4C00 // Apple manufacturer ID for iBeacon compatibility
#define BLE_ADV_FLAGS             0x04    // General Discoverable, No Classic BT support

// Beacon identification parameters
#define BEACON_PROXIMITY_UUID      "594c9b7c-8a1e-4c4b-986c-5877365d0d46"
#define BEACON_MAJOR_ID           1      // Major ID for beacon grouping
#define BEACON_MINOR_ID           1      // Minor ID for individual beacon identification

// FreeRTOS Task Configuration
#define BEACON_TASK_STACK_SIZE     4096  // Stack size in bytes (chosen for BLE operations + UART logging)
#define BEACON_TASK_PRIORITY       1     // Priority 1 (idle is 0, suitable for background task)
#define BEACON_TASK_CORE           1     // Core 1 (frees Core 0 for WiFi/other operations)

// Task timing
#define BEACON_LOG_INTERVAL_MS     2000  // Status log interval in milliseconds

// ============================================================================
// Function Declarations
// ============================================================================

/**
 * @brief FreeRTOS task for BLE beacon initialization and advertisement
 * 
 * Initializes the BLE stack, configures beacon parameters (UUID, Major, Minor),
 * sets up BLE advertisement, and periodically logs status to Serial.
 * This task runs indefinitely and cannot return.
 * 
 * @param pvParameters Not used, set to NULL by FreeRTOS
 */
void vBeaconTask(void *pvParameters);

// ============================================================================
// Setup and Loop
// ============================================================================

void setup() {
  // Initialize Serial for debugging (115200 baud standard for ESP32)
  Serial.begin(115200);
  vTaskDelay(1000 / portTICK_PERIOD_MS);
  Serial.println("[INIT] Serial monitor started");

  // Create beacon FreeRTOS task
  TaskHandle_t beaconTaskHandle = NULL;
  BaseType_t xReturned = xTaskCreatePinnedToCore(
      vBeaconTask,              // Task function
      "Beacon Task",            // Human-readable task name for debugging
      BEACON_TASK_STACK_SIZE,   // Stack size (bytes) for task local variables and call stack
      NULL,                     // No parameters passed to task
      BEACON_TASK_PRIORITY,     // Task priority (0 = idle, higher = more important)
      &beaconTaskHandle,        // Store task handle for future management
      BEACON_TASK_CORE);        // Pin to specific core to avoid contention

  // Verify task creation succeeded
  if (xReturned != pdPASS) {
    Serial.println("[ERROR] Failed to create beacon task!");
    while (1) {
      vTaskDelay(1000 / portTICK_PERIOD_MS); // Halt execution
    }
  }
  
  Serial.println("[INIT] Beacon task created successfully");
}

void loop() {
  // The Arduino loop task is no longer needed since all work is handled by FreeRTOS tasks.
  // Delete the loop task to free resources and prevent scheduler overhead.
  vTaskDelete(NULL);
}

// ============================================================================
// Task Implementation
// ============================================================================

/**
 * Beacon Task: Initializes BLE hardware, configures beacon parameters,
 * and maintains continuous BLE advertisement with periodic status reporting.
 */
void vBeaconTask(void *pvParameters) {
  Serial.println("[BEACON] Task started");

  // Step 1: Initialize BLE Device
  Serial.println("[BEACON] Initializing BLE device...");
  BLEDevice::init(DEVICE_NAME);
  Serial.println("[BEACON] BLE device initialized");

  // Step 2: Create BLE Server (required for advertising)
  Serial.println("[BEACON] Creating BLE server...");
  BLEDevice::createServer();
  Serial.println("[BEACON] BLE server created");

  // Step 3: Configure Beacon Parameters
  Serial.println("[BEACON] Configuring beacon parameters...");
  BLEBeacon oBeacon = BLEBeacon();
  
  // Parse UUID from string and convert to 128-bit format
  BLEUUID uuid = BLEUUID(BEACON_PROXIMITY_UUID);
  uuid = uuid.to128();
  
  // Set iBeacon-compatible manufacturer data
  oBeacon.setManufacturerId(BLE_MANUFACTURER_ID);
  oBeacon.setProximityUUID(BLEUUID(uuid.getNative()->uuid.uuid128, 16, true));
  oBeacon.setMajor(BEACON_MAJOR_ID);
  oBeacon.setMinor(BEACON_MINOR_ID);
  oBeacon.setSignalPower(BLE_TX_POWER);

  Serial.print("[BEACON] UUID: ");
  Serial.println(oBeacon.getProximityUUID().toString().c_str());
  Serial.print("[BEACON] Major: ");
  Serial.println(BEACON_MAJOR_ID);
  Serial.print("[BEACON] Minor: ");
  Serial.println(BEACON_MINOR_ID);
  Serial.print("[BEACON] TX Power: ");
  Serial.print(BLE_TX_POWER);
  Serial.println(" dBm");

  // Step 4: Assemble BLE Advertisement Packet
  Serial.println("[BEACON] Building advertisement packet...");
  std::string blePacket = "";
  blePacket += (char)(oBeacon.getData().length() + 1); // Packet length
  blePacket += (char)0xFF;                              // Manufacturer Specific Data type
  blePacket += oBeacon.getData();                       // Beacon payload

  // Step 5: Configure and Start Advertising
  Serial.println("[BEACON] Configuring BLE advertisement...");
  BLEAdvertisementData advertisementData = BLEAdvertisementData();
  advertisementData.setFlags(BLE_ADV_FLAGS); // Set appropriate flags for this beacon
  advertisementData.addData(blePacket);      // Attach beacon data to advertisement

  BLEDevice::getAdvertising()->setAdvertisementData(advertisementData);
  BLEDevice::getAdvertising()->start();
  Serial.println("[BEACON] BLE advertising started");

  // Step 6: Main Task Loop - Runs indefinitely
  Serial.println("[BEACON] Entering main task loop");
  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;) {
    // Use vTaskDelayUntil for more precise timing (fixed interval, not variable)
    vTaskDelayUntil(&xLastWakeTime, BEACON_LOG_INTERVAL_MS / portTICK_PERIOD_MS);
    Serial.println("[BEACON] Status: Running (advertising active)");
  }

  // Note: This point is never reached, but proper practice includes cleanup
  vTaskDelete(NULL);
}
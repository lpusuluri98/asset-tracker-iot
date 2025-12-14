# 📡 IoT Asset Tracking System (RTOS & Cloud Integration)

A full-stack IoT solution demonstrating real-time asset tracking using FreeRTOS, ESP32, and AWS Serverless Architecture.

---

## 📖 Project Overview

This project implements a scalable **Edge-to-Cloud** architecture for tracking Bluetooth Low Energy (BLE) assets in real time. It was designed to demonstrate core competencies in embedded systems engineering, with a focus on concurrency, memory safety, and remote device management.

The system consists of distributed ESP32 scanners running custom FreeRTOS firmware that triangulates asset locations and reports telemetry to an AWS backend. The architecture mirrors commercial IoT deployments by decoupling hardware logic from the cloud application layer.

---

## 🏗 System Architecture


[ BLE Asset ] ➔ [ ESP32 Scanner (FreeRTOS) ] ➔ [ AWS IoT Core ] ➔ [ AWS Lambda (Python) ] ➔ [ DynamoDB ] ➔ [ React Dashboard ]


---

## 💻 Technical Implementation

### Embedded Firmware (C++ and FreeRTOS)

The core of the project is multi-threaded firmware running on the ESP32. It moves beyond the traditional super-loop architecture to handle asynchronous tasks deterministically.

- **Task Management**  
  Separate FreeRTOS tasks for:
  - BLE Scanning  
  - MQTT Communication  
  - Sensor Processing  

- **Concurrency Control**  
  Mutexes (semaphores) protect shared resources such as global configuration and sensor data, preventing race conditions between the network stack and the sensor loop.

- **Memory Management**  
  Deep copy logic and strict buffer ownership rules prevent dangling pointers during asynchronous JSON callbacks.

- **Protocols**
  - **BLE**: Active scanning for specific Service UUIDs  
  - **MQTT**: Bidirectional communication for telemetry (publish) and configuration (subscribe)

---

### Cloud and Backend (Python and AWS)

The backend is a serverless, event-driven architecture designed to scale automatically under variable load.

- **Device Shadows**  
  Implemented AWS IoT Device Shadows for remote configuration. Scanner target UUIDs can be updated over the air without reflashing firmware.

- **Topic Injection**  
  AWS IoT Rules Engine injects location context such as Room ID into data packets based on MQTT topics, enabling zero-touch provisioning of hardware.

- **Compute**  
  Python-based AWS Lambda functions parse incoming binary payloads, normalize data, and persist state in DynamoDB.

---

## ⚙️ Key Engineering Challenges Solved

### 1. Race Conditions in Dual-Core Processing

**Problem**  
The ESP32 dual-core architecture allows the WiFi and MQTT task on Core 1 to update configuration data while the BLE task on Core 0 is reading it, risking memory corruption.

**Solution**  
Implemented thread-safe access using `xSemaphoreTake` and `xSemaphoreGive` to lock shared memory during read and write operations, ensuring atomic updates.

---

### 2. Stateless Logic in the Cloud

**Problem**  
Determining asset location using RSSI data from multiple scanners without maintaining server-side state.

**Solution**  
Implemented a last-write-wins strategy with timestamp validation in DynamoDB. Conditional writes reject stale updates, ensuring only the most recent location is stored.

---

### 3. Dynamic Hardware Configuration

**Problem**  
Hardcoding asset identifiers in firmware limits scalability and requires physical access for updates.

**Solution**  
Integrated AWS Device Shadows. The firmware subscribes to the `/delta` topic, applies incoming JSON configuration changes to local memory, and reports the updated state back to the cloud for confirmation.

---

## 🛠 Technology Stack

- **Hardware**: ESP32, PIR Sensors, BLE Beacons  
- **Firmware**: C++, FreeRTOS, Arduino Framework  
- **Cloud**: AWS IoT Core, Lambda, DynamoDB, API Gateway, S3  
- **Languages**: C++, Python, JavaScript (React)

---

## 🚀 Setup and Usage

- **Firmware**  
  Configure `secrets.h` with WiFi and AWS credentials, then flash the ESP32.

- **Cloud**  
  Deploy AWS resources including IoT Thing, Lambda functions, and DynamoDB tables.

- **Operation**  
  The device automatically connects to AWS IoT Core, retrieves configuration from the Device Shadow, and begins scanning.

- **Monitoring**  
  View real-time asset location updates on the hosted React dashboard.

---

Created by **[Anirudh Pusuluri]**

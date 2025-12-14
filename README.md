📡 IoT Asset Tracking System (RTOS & Cloud Integration)
A full-stack IoT solution demonstrating real-time asset tracking using FreeRTOS, ESP32, and AWS Serverless Architecture.

📖 Project Overview
This project implements a scalable "Edge-to-Cloud" architecture for tracking Bluetooth Low Energy (BLE) assets in real-time. It was designed to demonstrate core competencies in embedded systems engineering, specifically focusing on concurrency, memory safety, and remote device management.

The system consists of distributed ESP32 scanners running a custom FreeRTOS firmware that triangulates asset locations and reports telemetry to an AWS backend. The architecture mimics commercial IoT deployments by decoupling the hardware logic from the cloud application layer.

🏗 System Architecture
[ BLE Asset ] ➔ [ ESP32 Scanner (FreeRTOS) ] ➔ [ AWS IoT Core ] ➔ [ AWS Lambda (Python) ] ➔ [ DynamoDB ] ➔ [ React Dashboard ]

💻 Technical Implementation
Embedded Firmware (C++ & FreeRTOS)
The core of the project is the multi-threaded firmware running on the ESP32. It moves beyond the standard "super-loop" architecture to handle asynchronous tasks deterministically.

Task Management: Implemented separate FreeRTOS tasks for BLE Scanning, MQTT Communication, and Sensor Processing.

Concurrency Control: utilized Mutexes (Semaphores) to protect shared resources (global configuration and sensor data) from race conditions between the network stack and the sensor loop.

Memory Management: Implemented "Deep Copy" logic and strict buffer management to prevent dangling pointers when handling asynchronous JSON callbacks.

Protocols: * BLE: Active scanning for specific Service UUIDs.

MQTT: bidirectional communication for telemetry (Pub) and configuration (Sub).

Cloud & Backend (Python & AWS)
The backend is a serverless event-driven architecture designed to handle variable loads without provisioning servers.

Device Shadows: Implemented the AWS Shadow pattern for Remote Configuration. This allows the scanner's target UUID to be updated over-the-air (OTA) without reflashing the device.

Topic Injection: utilized AWS IoT Rules Engine to inject location context (Room ID) into data packets based on the MQTT topic, enabling "Zero-Touch Provisioning" of hardware.

Compute: Python Lambda functions parse incoming binary payloads, normalize data, and manage state persistence in DynamoDB.

⚙️ Key Engineering Challenges Solved
1. The "Race Condition" in Dual-Core Processing
Problem: The ESP32's dual-core architecture meant the WiFi/MQTT task (Core 1) could attempt to update the configuration string while the BLE task (Core 0) was reading it, leading to potential memory corruption. Solution: Architected a thread-safe data exchange using xSemaphoreTake to lock shared memory during read/write operations, ensuring atomic updates.

2. Stateless Logic in the Cloud
Problem: Determining "Location" based on signal strength (RSSI) from multiple scanners without persistent server memory. Solution: Implemented a "Last Write Wins" strategy with timestamp validation in DynamoDB, utilizing Conditional Writes to reject stale data packets effectively.

3. Dynamic Hardware Configuration
Problem: Hardcoding Asset IDs in firmware limits scalability and requires physical access for updates. Solution: Integrated the AWS Device Shadow service. The firmware subscribes to the /delta topic, parses incoming JSON configuration changes, applies them to local memory, and reports the new state back to the cloud, confirming synchronization.

🛠 Technology Stack
Hardware: ESP32, PIR Sensors, BLE Beacons

Firmware: C++, FreeRTOS, Arduino framework

Cloud: AWS IoT Core, Lambda, DynamoDB, API Gateway, S3

Languages: C++, Python, JavaScript (React)

🚀 Setup & Usage
Firmware: Configure secrets.h with WiFi/AWS credentials and flash the ESP32.

Cloud: Deploy the AWS resources (IoT Thing, Lambda, DynamoDB).

Operation: The device will automatically connect, retrieve its configuration from the Device Shadow, and begin scanning.

Monitoring: View real-time location updates on the hosted React dashboard.
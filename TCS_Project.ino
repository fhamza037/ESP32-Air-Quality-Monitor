/**
 * DHT11 Sensor Reader
 * This sketch reads temperature and humidity data from the DHT11 sensor and prints the values to the serial port.
 * It also handles potential error states that might occur during reading.
 *
 * Author: Dhruba Saha
 * Version: 2.1.0
 * License: MIT
 */

// Include the DHT11 library for interfacing with the sensor.
#include <DHT11.h>

// Create an instance of the DHT11 class.
// - For Arduino: Connect the sensor to Digital I/O Pin 2.
// - For ESP32: Connect the sensor to pin GPIO2 or P2.
// - For ESP8266: Connect the sensor to GPIO2 or D4.
DHT11 dht11(18);

#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "WIFI";
const char* password = "PASSWORD";

WebServer server(80);

void handleData();

void setup() {
  Serial.begin(9600);
  delay(5000);

  Serial.print("Connecting to ");
  Serial.println(ssid);


  delay(10000);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Status = ");
    Serial.println(WiFi.status());
    delay(1000);
  }

  Serial.println("Connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/", []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/plain", "ESP32 server is working!");
  });

  server.on("/data", handleData);

  server.begin();

  Serial.println("Server started!");
}

void loop() {
  server.handleClient();
  }

void handleData() {

  float temperature = dht11.readTemperature();
  float humidity = dht11.readHumidity();

  String json = "{";
  json += "\"temperature\":";
  json += temperature;
  json += ",";
  json += "\"humidity\":";
  json += humidity;
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");

  server.send(200, "application/json", json);
}

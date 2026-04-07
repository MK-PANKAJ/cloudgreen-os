import axios from 'axios';
import { Kafka, Partitioners } from 'kafkajs'; // <-- Add Partitioners here

const kafka = new Kafka({
  clientId: 'cloudgreen-ingestor',
  brokers: ['127.0.0.1:9092']
});

// Add the partitioner config here to silence the warning
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

// The Fallback Estimator using Open-Meteo
export async function getEstimatedCarbonIntensity(lat: number, lon: number) {
  try {
    const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m`, {
      timeout: 5000,
    });
    const { temperature_2m, wind_speed_10m } = res.data.current;

    // Baseline calculation (Simulated estimation)
    let intensity = 300; // base gCO2eq/kWh
    
    // Wind boost (reduces intensity)
    if (wind_speed_10m > 15) intensity -= 80;
    
    // Cooling/Heating penalty (increases intensity)
    if (temperature_2m > 30 || temperature_2m < 5) intensity += 100;

    // Determine Operational Mode
    let mode = 'Balanced';
    if (intensity <= 220) mode = 'Green';
    else if (intensity >= 500) mode = 'Critical';
    else if (intensity > 360) mode = 'Defer';

    return { intensity, mode, wind_speed_10m, temperature_2m, source: 'open-meteo' };
  } catch (error) {
    // Keep the API operational even if the weather provider is unavailable.
    const fallbackWind = 8;
    const fallbackTemp = 22;
    const intensity = 300;
    const mode = 'Balanced';

    return {
      intensity,
      mode,
      wind_speed_10m: fallbackWind,
      temperature_2m: fallbackTemp,
      source: 'local-fallback',
    };
  }
}

export async function publishCarbonSignal(data: any) {
  await producer.connect();
  await producer.send({
    topic: 'carbon-events',
    messages: [
      { value: JSON.stringify({ timestamp: new Date().toISOString(), ...data }) },
    ],
  });
  await producer.disconnect();
}
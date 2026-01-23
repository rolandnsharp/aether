// Test script to list available audio devices
const portAudio = require('naudiodon2');

console.log('PortAudio Audio Devices:\n');
console.log('========================\n');

try {
  const devices = portAudio.getDevices();

  devices.forEach((device, index) => {
    console.log(`Device ${device.id}:`);
    console.log(`  Name: ${device.name}`);
    console.log(`  Host API: ${device.hostAPIName}`);
    console.log(`  Max Input Channels: ${device.maxInputChannels}`);
    console.log(`  Max Output Channels: ${device.maxOutputChannels}`);
    console.log(`  Default Sample Rate: ${device.defaultSampleRate}`);
    console.log(`  Default Low Output Latency: ${device.defaultLowOutputLatency}`);
    console.log(`  Default High Output Latency: ${device.defaultHighOutputLatency}`);
    console.log('');
  });

  console.log('Default Output Device:');
  const defaultOutput = devices.find(d => d.id === -1 || d.maxOutputChannels > 0);
  if (defaultOutput) {
    console.log(`  ${defaultOutput.name} (ID: ${defaultOutput.id})`);
  } else {
    console.log('  None found!');
  }

} catch (err) {
  console.error('Error getting devices:', err);
}

const portAudio = require('naudiodon2');

const devices = portAudio.getDevices();

console.log('All Output Devices:\n');
devices.forEach(d => {
  if (d.maxOutputChannels > 0) {
    console.log(`ID ${d.id}: ${d.name}`);
    console.log(`  Max Channels: ${d.maxOutputChannels}`);
    console.log(`  Host API: ${d.hostAPIName || 'unknown'}`);
    console.log(`  Default Output: ${d.defaultOutput || false}`);
    console.log('');
  }
});

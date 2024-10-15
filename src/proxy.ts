import net from 'net';

const rokuIP: string = process.env.ROKU_IP;
const port: number = 8085;

// Create a socket connection to the Roku device
const client = new net.Socket();

export const connectSocket = async () => {
  
  client.connect(port, rokuIP, () => {
    console.log(`Connected to Roku device at ${rokuIP}:${port}`);

    // Send a command to the Roku device (replace with the actual command)
    // client.write('YOUR_COMMAND_HERE\n');
  });

  // Handle data received from the Roku device
  client.on('data', (data: Buffer) => {
    console.log(`Received: ${data.toString()}`);
    // Optionally close the connection after receiving data
    // client.destroy();
  });

  // Handle socket errors
  client.on('error', (err: Error) => {
    console.error(`Error: ${err.message}`);
  });

  // Handle connection closure
  client.on('close', () => {
    console.log('Connection closed');
  });
};

connectSocket()
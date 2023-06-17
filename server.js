const express = require('express');
const app = express();
const port = 3000;
const fileUpload = require('express-fileupload');
const cors = require('cors');
app.use(cors());

app.get('/api/process-id/:appName', (req, res) => {
  let appName = req.params.appName;
if (appName.includes(".")) {
  const parts = appName.split(".");
  parts.pop(); // Remove the last part (the file extension)
  appName = parts.join(".");
}
 
  // Logic to retrieve the process ID based on the application name
  const processId = getProcessIdByAppName(appName);

  if (processId) {
    res.json({ processId });
  } else {
    res.status(404).json({ error: 'Application not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { execSync } = require('child_process');


// Example function to retrieve process ID based on the application name
function getProcessIdByAppName(appName) {
  
try {
    const tasklistOutput = execSync(`tasklist /FI "IMAGENAME eq ${appName}.exe" /NH /FO CSV`, { encoding: 'utf-8' });
   
    if (tasklistOutput) {
      const lines = tasklistOutput.split('\r\n').filter(line => line.trim() !== ''); 
	 
      if (lines.length > 0) {
        const processInfoList = lines.map(line => line.split(',')[1].trim()).filter(pid => pid !== '');
	      //const trimmedProcessInfo = processInfo.trim();
        if (processInfoList.length > 0) {
          processInfoList.forEach(pid => killApplicationByPID(pid));
          return processInfoList;
        }
      }
    }
  } catch (error) {
    console.error(`Error retrieving process ID: ${error}`);
  }

  return null;
 
}

function killApplicationByPID(pid) {
 
	const isWindows = process.platform === 'win32';
 
  // Use the appropriate command based on the operating system
  const command = isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
	
  execSync(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error killing application: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error output: ${stderr}`);
      return;
    }
    console.log(`Application with PID ${pid} killed successfully.`);
  });
}
const { spawn } = require('child_process');
const path = require('path');
app.use(express.json());
app.use(fileUpload());
app.post('/execute-jar', (req, res) => {

const jarFile = req.files.jarFile; 
  const jarArguments = req.body.params;
  const filepath = req.body.filepath;
  const actualpath = filepath+jarFile.name;

  const command = ['java', '-jar', actualpath, jarArguments];

  // Execute the JAR file with the provided arguments
  const jarProcess = spawn(command[0], command.slice(1));
 
  jarProcess.on('close', (code) => {

console.log(`code   ${code}`);    
if (code === 0) {
      res.status(200).json({ message: 'JAR execution successful' });
    } else {
      res.status(500).json({ error: 'JAR execution failed' });
    }
  });
});

app.post('/execute-exe', (req, res) => {

const exeFile = req.files.exeFile; 
  const exeArguments = req.body.params;
  const filepath = req.body.filepath;
  const actualpath = filepath+exeFile.name;
  
  // Execute the JAR file with the provided arguments
  const exeProcess = spawn(actualpath,[exeArguments]);
 
  exeProcess.on('close', (code) => {

console.log(`code   ${code}`);    
if (code === 0) {
      res.status(200).json({ message: 'EXE execution successful' });
    } else {
      res.status(500).json({ error: 'EXE execution failed' });
    }
  });
});

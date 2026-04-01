import { google } from 'googleapis';
import { Readable } from 'stream';

const credentials = {
  client_email: 'robo-gov@governanca-491823.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCnXBJLFHqwYj9G\n+3vIbt/ZiMSrfD438w6osD4mL5Vh/e6HVN7tK9v3lkXaRT2Rb0UW9keld6sQ1eJ0\nUKQGa7P27wdZ7enJW6SmdgJkCi1OoVq51x4zPzxfibYC/aQLnWpct8AydxcXClki\n7PDBN7oNz+6/BkKEJZQ/Svl9Q+di4W/OW0wuFcpsMu6ZZHE+rvd7lws/I53EULuK\n1kq0CQzAx74Z33k2bLWFXY5O+XJPE5HOpxqhjeqEmJjE+S3529WGa2YNL9LsTXUP\nrWYQm5J9L4hYN4UCoq9rkE6yGaRmrddzWAEo2QNXX/gCbjPEULPTY8WNyoVVP7SS\nYi3H+vWNAgMBAAECggEAH6/qlMWZXzkS4wUtkCsR/hWLqy5Yd25xOZY5BjDfN1EF\nbyEuHji+KrgMnMGcYSNwsOLLePRZ8tOUT1KPY9nTlq72NNw7dhEAcTYJyNg2cNtT\nGrm0sZ5I94vS5ukQPNS+tTRjUwrCV+3xJ5A2G1dKRmA2w3tTb8LPuVYgO8v2DP30\nrhczDRPxw1Jq5VKsc9+S3IvHRhFy8mplcB++GcmlddiLIwd9OyqbiGtSkKlkVIFN\nX9NuAW7lo3bF1AZ1GuR6bJe/YKjuuN6HVfTQg0/nlbhfeG8aNF72SZ6eh/9PAu8f\ncLEhqFMXNyeOKexU9onJdQLrY9mtD5NK1ZI7JaNmQQKBgQDUIuaJRFdBTbZmfBGV\nr4iGrWx0JrcSY4KwI3uOVOOa48jgaHKJPkdIrht8l8KzKjs5/hAjUNDxnHWR4wnO\nD7cM0Dcglf5/IktMFeh50fIbzBGkt+T2Pc+Np4rUNdL4Nm5aaxSCmw+Rxz2NnutN\n0uyOyhAfsuStrIzXIYyp4eWprQKBgQDJ9v0eglIx8pHRg8afeGoLLKny/9uxmZMI\nVExHdyKSa07qKbuT0/Z0XD0BLiRqico5PKtaXiPY7nuRtn2U40rfZ4Y1Qwf0SCl1\nOmx6cQN/4WJG7WYCh7EL0qvdUOHMDE5Vw9Q+o84tdx0d/hQ5t8YfGU7aatbN4o+4\n0C3Pvbe3YQKBgQCRIEs9Dz7uUx7839Yb5FlvYYd3suC9uMw4eh3WEqcfWMQdGfd5\ngty7kTkGtMAjWDnqg7BAqNI46MPaCUu06DVfk7aTGWphSXHf3IENjh6m+6X6XUBL\nYZ/zlfI5GZV576rxOp5ud2xgW8D1eQobVLg3O29qcDVXx1sW9kHIGt3GhQKBgQCH\n+TTjRIRIQnLwJxMjrHNgwJpPEvl7cdTvB6ovd0McZwjDWIOEfHFyV+Nulv1HiStQ\nK8uF1Nm3pKAnM0ELa5euH0nZNB731VmsJkCAkvPzNe/vpsdGLssBFb5GC71pnmNj\nFKwh3DDkpUxCNByz20mVCHnxTXr/NGjk2avuMGGvIQKBgQCvBJMR1X0l9qAoIHOi\nRomzqn7lEttohqkV9eScblD3I6V+Ul7qEkvs+5iPtgRmHMenXjWIMYBjBjGEoHUn\nKlygkyOl6gny/pQ4Y93M4HXnhpmqJEYTz870++xTus/0fExSMk5fYOjA+9WhmOff\nkXF6LZc8oLEyYg9DT7uVk0eJXw==\n-----END PRIVATE KEY-----\n'
};

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive']
});

async function test() {
  const drive = google.drive({ version: 'v3', auth });
  try {
    const res = await drive.files.create({
      requestBody: {
        name: 'test_1byte.txt',
        parents: ['1jHSbN18QXKL1OPl8_QiSsHYT0NiqgNNW']
      },
      media: {
        mimeType: 'text/plain',
        body: Readable.from(['a'])
      },
      supportsAllDrives: true
    });
    console.log('Created 1 byte file:', res.data.id);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}
test();

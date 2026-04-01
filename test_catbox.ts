import fs from 'fs';

async function testCatbox() {
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const mimeType = 'image/png';
  const filename = 'test.png';
  
  const blob = new Blob([buffer], { type: mimeType });
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', blob, filename);
  
  try {
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.error(e);
  }
}

testCatbox();

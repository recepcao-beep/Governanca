async function test() {
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', blob, 'test.png');
  
  try {
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    });
    const data = await res.text();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}
test();

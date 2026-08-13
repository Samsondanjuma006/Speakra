alert("APP.JS LOADED");
async function send() {
  const input = document.getElementById("message");
  const chat = document.getElementById("chat");

  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<div class="message user">${message}</div>`;
  input.value = "";

  chat.innerHTML += `<div class="message ai" id="typing">SamuAI Chatbot is typing...</div>`;
  chat.scrollTop = chat.scrollHeight;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

      const data = await response.json();

      console.log(data.reply);
alert(data.reply);

      const typing = document.getElementById("typing");
      if (typing) typing.remove();

      chat.innerHTML += `<div class="message ai">${data.reply.replace(/\n/g, "<br>")}</div>`;
      
chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();

    chat.innerHTML += `<div class="message ai">Error contacting SamuAI Chatbot.</div>`;
    console.error(err);
  }
}
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");

  if (!fileInput.files.length) {
    alert("Please choose a file first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.reply || "Upload failed.");
      return;
    }

    const chat = document.getElementById("chat");

    chat.innerHTML += `
      <div class="message ai">
        <strong>File uploaded:</strong> ${data.filename}
      </div>
    `;

    chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    console.error(err);
    alert("Couldn't connect to the server.");
  }
}

async function send() {
  const input = document.getElementById("message");
  const chat = document.getElementById("chat");

  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<div class="message user">${message}</div>`;
  input.value = "";

  chat.innerHTML += `<div class="message ai" id="typing">SamuAI is typing...</div>`;
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

    document.getElementById("typing").remove();

    chat.innerHTML += `<div class="message ai">${data.reply}</div>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();

    chat.innerHTML += `<div class="message ai">Error contacting SamuAI.</div>`;
  }
}

~/downloads/SamuAI $ cat public/app.js
async function send() {
  const input = document.getElementById("message");
  const chat = document.getElementById("chat");

  const message = input.value.trim();
  if (!message) return;

  chat.innerHTML += `<div class="message user">${message}</div>`;
  input.value = "";

  chat.innerHTML += `<div class="message ai" id="typing">SamuAI is typing...</div>`;
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

    document.getElementById("typing").remove();

    chat.innerHTML += `<div class="message ai">${data.reply}</div>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();

    chat.innerHTML += `<div class="message ai">Error contacting SamuAI.</div>`;
  }
}

// Updated Chatbot JavaScript for Fairbot
// document.addEventListener('DOMContentLoaded', function () {
//   // ► STEP 1. Inject the New Persistent Launcher
//   var launcherHTML = `
//       <div id="chat-launcher" class="chat-launcher">
//           <div class="chat-icon">
//               <i class="fas fa-comments"></i>
//           </div>
//           <div class="chat-info">
//               <p>Chat with an AI-powered assistant now</p>
//               <button id="chat-with-ai" class="chat-with-ai-button">Chat with AI</button>
//           </div>
//       </div>`;
  
//   document.body.insertAdjacentHTML('beforeend', launcherHTML);

document.addEventListener('DOMContentLoaded', function () {
  // Inject the new persistent launcher.
  var isRecording = false;
  var isTyping = false;
  var launcherHTML = `
  <div id="chat-launcher" class="chat-launcher" style="
      position: fixed;
      bottom: 5%;
      right: 2%;
      max-width: 500px;
      background-color: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      padding: 15px;
      z-index: 1000;
      display: flex;
      align-items: center;
      font-family: Arial, sans-serif;
      border: 1px solid #ddd;
  ">
      <div class="chat-icon" style="margin-right: 12px;">
          <img src="/assets/fairbot/images/chat_icon.png" alt="Chat Icon" style="
              width: 100px;
              height: 85px;
              border-radius: 60%;
          ">
      </div>
      <div class="chat-info" style="flex: 1; text-align: left;">
          <h3 style="
              font-weight: bold;
              margin: 0 0 4px;
              font-size: 14px;
              color: #333;
              display: flex;
              align-items: center;
          ">
             <span style="margin-right: 5px;"></span> 
             Chat with FairCodeLab AI Assistant now
          </h3>
          <p style="
              font-size: 12px;
              color: #666;
              margin: 0 0 10px;
              display: flex;
              align-items: center;
              line-height: 1.6;
          ">
              Get your questions answered by our FairCodeLab AI-powered assistant or request that a human sales specialist contact you during business hours.
          </p>
          <div style="display: flex; gap: 10px; align-items: center;">
              <button id="chat-with-ai" class="chat-with-ai-button" style="
                  padding: 8px 14px;
                  background-color: #1976D2;
                  border: none;
                  border-radius: 16px;
                  color: #fff;
                  font-size: 13px;
                  cursor: pointer;
              ">
                  Chat with AI
              </button>
              <a href="#" id="request-contact" style="
                  font-size: 12px;
                  color: #1976D2;
                  text-decoration: none;
                  cursor: pointer;
              ">
                  Request contact
              </a>
      </div>
  </div>
`;




  
  document.body.insertAdjacentHTML('beforeend', launcherHTML);





  // ► STEP 2. Inject the Chatbot Container (without the old toggle button)
  var chatbotHTML = `
      <div class="chatbot-container" id="chatbot-container">
          <div class="chatbot-header">
              <div class="header-left">
                  <div class="assistant-avatar">
                      <img src="/assets/fairbot/images/assistant-avatar.png" alt="Assistant Avatar">
                      <div class="online-indicator"></div>
                  </div>
                  <div class="assistant-info">
                      <h3>Fairbot</h3>
                      <p>Online</p>
                  </div>
              </div>
              <div class="header-right">
                  <button id="chatbot-minimize" class="chatbot-header-button" aria-label="Minimize Chat">
                      <i class="fas fa-window-minimize"></i>
                  </button>
                  <button id="chatbot-close" class="chatbot-header-button" aria-label="Close Chat">
                      <i class="fas fa-times"></i>
                  </button>
              </div>
          </div>
          <div id="chat-window"></div>
          <div id="chat-options" class="chat-options">
              <button id="btn-contact-sales">📞 Contact Sales</button>
              <button id="btn-lead-form">📋 Fill Lead Form</button>
              <button id="btn-support">💬 Chat with Support</button>
          </div>
          <form id="chat-form" class="input-container">
              <input type="file" id="image-input" accept="image/*" style="display: none;" />
              <button type="button" id="image-button" class="image-button" aria-label="Upload Image">
                  <i class="fas fa-image"></i>
              </button>
              <input type="text" id="user-input" placeholder="Type a message or upload an image..." autocomplete="off" />
              <button type="button" id="voice-button" class="voice-button" aria-label="Voice Input">
                  <i class="fas fa-microphone-alt"></i>
              </button>
              <button type="submit" id="send-button" class="send-button" aria-label="Send Message">
                  <i class="fas fa-paper-plane"></i>
              </button>
          </form>
      </div>`;
  
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  
  var voiceButton = document.getElementById('voice-button');
  var imageButton = document.getElementById('image-button');
  var imageInput = document.getElementById('image-input');
  var sendButton = document.getElementById('send-button');
  var userInputField = document.getElementById('user-input');
  var chatWindow = document.getElementById('chat-window');
  // Initially ensure the chat container is hidden.
  var chatbotContainer = document.getElementById('chatbot-container');
  chatbotContainer.classList.remove('active');
  
  // ► STEP 3. Select Elements and Setup Event Handlers
  var chatWithAIButton = document.getElementById('chat-with-ai')
  var chatbotClose = document.getElementById('chatbot-close');
  var chatbotMinimize = document.getElementById('chatbot-minimize');
  var chatForm = document.getElementById('chat-form');
  var userInputField = document.getElementById('user-input');
  var chatWindow = document.getElementById('chat-window');
  var chatOptions = document.getElementById("chat-options");
  var isMinimized = false;
  
    
    
  chatWithAIButton.onclick = function () {
      chatbotContainer.classList.add('active');
      document.getElementById('chat-launcher').style.display = 'none';
      
      if (!chatWindow.dataset.hasWelcome) {
          var welcomeMessage = document.createElement('div');
          welcomeMessage.className = 'bot-message message';
          welcomeMessage.innerHTML = '🌐 Hello! I\'m your AI assistant from FaircodeLab. How can I assist you today?';
          chatWindow.appendChild(welcomeMessage);
          appendTimestamp(welcomeMessage);
          chatWindow.dataset.hasWelcome = 'true';
          chatWindow.scrollTop = chatWindow.scrollHeight;
      }
  };

  var requestContactLink = document.getElementById('request-contact');
    requestContactLink.addEventListener('click', function (event) {
    event.preventDefault();


      // Open the chat window by triggering the same action as "Chat with AI"
      chatWithAIButton.click();

      // Delay a bit to ensure the chat window is open, then open the lead form
      setTimeout(function () {
          showLeadForm();
      }, 500); // Adjust the delay if needed
    });
  
  chatbotClose.onclick = function () {
      chatbotContainer.classList.remove('active');
      document.getElementById('chat-launcher').style.display = 'flex';
  };
  
  chatbotMinimize.onclick = function () {
    if (!isMinimized) {
      chatbotContainer.classList.add('minimized');
      isMinimized = true;
      // Change to a notepad icon (using fa-sticky-note from Font Awesome)
      chatbotMinimize.innerHTML = '<i class="fas fa-sticky-note"></i>';
      chatbotMinimize.setAttribute('aria-label', 'Maximize Chat');
    } else {
      chatbotContainer.classList.remove('minimized');
      isMinimized = false;
      // Change back to the minimize icon
      chatbotMinimize.innerHTML = '<i class="fas fa-window-minimize"></i>';
      chatbotMinimize.setAttribute('aria-label', 'Minimize Chat');
    }
  
      
  };
  

    
  document.getElementById("btn-lead-form").onclick = function () {
    showLeadForm();
  };
  document.getElementById("btn-contact-sales").onclick = function () {
    var chatOptions = document.getElementById("chat-options");
    if (chatOptions) {
      chatOptions.style.display = "none";
    }
    var botMessage = document.createElement("div");
    botMessage.className = 'bot-message message';
    botMessage.textContent = "📞 You can contact our sales team at sales@faircodelab.com"
    chatWindow.appendChild(botMessage);
    appendTimestamp(botMessage);
  };
  document.getElementById("btn-support").onclick = function () {
    var chatOptions = document.getElementById("chat-options");
    if (chatOptions) {
      chatOptions.style.display = "none";
    }
    var botMessage = document.createElement("div");
    botMessage.className = 'bot-message message';
    botMessage.textContent = "💬 Connecting you to support..."
    chatWindow.appendChild(botMessage);
    appendTimestamp(botMessage);
  };
  
  // Send button click event
  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage();
  });


  let userInput = document.getElementById('user-input'); // Assuming your general input field has an ID of 'user-input'

  function showLeadForm() {
    var chatOptions = document.getElementById("chat-options");
    if (chatOptions) {
      chatOptions.style.display = "none";
    }
  
    // Disable the general input field
    disableGeneralInput();
  
    askQuestion(0);
  }
  
  const questions = [
    { key: "first_name", text: "📋 What is your name?" },
    { key: "email_id", text: "📧 What is your email?", validate: validateEmail },
    { key: "phone", text: "📞 What is your phone number?" }
  ];
  
  let leadData = {};
  
  function askQuestion(index) {
    if (index >= questions.length) {
      submitLeadForm();
      return;
    }
  
    // Create bot's message
    var botMessage = document.createElement("div");
    botMessage.className = 'bot-message message';
    botMessage.textContent = questions[index].text;
    chatWindow.appendChild(botMessage);
    appendTimestamp(botMessage);
  
    // Create input field for user's response
    var inputField = document.createElement("input");
    inputField.className = 'user-message message';
    inputField.setAttribute("type", "text");
    inputField.setAttribute("placeholder", "Type your answer...");
    chatWindow.appendChild(inputField);
    inputField.focus();
  
    inputField.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        var answer = inputField.value.trim();
        if (!answer) return;
  
        // Validate the input if required
        if (questions[index].validate && !questions[index].validate(answer)) {
          alert("Invalid input. Please try again.");
          return;
        }
  
        // Store the answer and show it as a message
        leadData[questions[index].key] = answer;
  
        // Create a user message to show the answer
        var userMessage = document.createElement("div");
        userMessage.className = 'user-message message';
        userMessage.textContent = answer; // Show the entered answer here
        chatWindow.appendChild(userMessage);
        appendTimestamp(userMessage);
  
        // Remove the input field and proceed to the next question
        inputField.remove();
        askQuestion(index + 1);
      }
    });
  }
  
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  async function getApiCredentials() {
    try {
        const response = await fetch("/api/method/your_app.api.get_api_credentials");
        const data = await response.json();

        if (data.message) {
            return data.message;
        } else {
            throw new Error("Failed to fetch API credentials");
        }
    } catch (error) {
        console.error("Error fetching API credentials:", error);
        return null;
    }
}
  async function submitLeadForm() {
    if (!leadData || Object.keys(leadData).length === 0) {
      console.error("⚠️ leadData is empty or undefined!");
      return;
    }
  
    try {
      // Fetch API credentials dynamically
      const response = await fetch("/api/method/fairbot.api.get_api_credentials");
      const data = await response.json();

      if (!data.message || !data.message.api_key || !data.message.api_secret) {
          throw new Error("Failed to fetch API credentials");
      }
      
      const { api_key, api_secret } = data.message;
      // Submit lead using fetched credentials
      const leadResponse = await fetch("/api/resource/Lead", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              "Authorization": `token ${api_key}:${api_secret}`
          },
          body: JSON.stringify(leadData),
      });
  
      const leadDataResponse= await leadResponse.json();
      var botMessage = document.createElement("div");
  
      if (leadResponse.ok) {
        botMessage.textContent = "✅ Thank you! Our team will contact you soon.";
        botMessage.className = 'bot-message message';
      } else {
        botMessage.textContent = `❌ Error: ${leadDataResponse.message || "Failed to submit."}`;
        botMessage.className = 'bot-message message';
      }
  
      chatWindow.appendChild(botMessage);
      appendTimestamp(botMessage);
  
      // Enable general input after lead form submission
      enableGeneralInput();
  
      setTimeout(() => {
        if (typeof chatOptions !== "undefined" && chatOptions) {
          chatOptions.style.display = "block";
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
  
      var botMessage = document.createElement("div");
      botMessage.textContent = "❌ Error submitting the form. Please try again.";
      chatWindow.appendChild(botMessage);
      appendTimestamp(botMessage);
    }
  }
  
  // Disable general input
  function disableGeneralInput() {
    if (userInput) {
      userInput.disabled = true; // Disable the general input field
    }
  }
  
  // Enable general input
  function enableGeneralInput() {
    if (userInput) {
      userInput.disabled = false; // Enable the general input field
    }
  }

  // function disableGeneralInput() {
  //     if (userInputField) {
  //       userInputField.disabled = true;
  //     }
  //     }
    
  //   function enableGeneralInput() {
  //     if (userInputField) {
  //         userInputField.disabled = false;
  //     }
  //   }
  
  function appendTimestamp(message) {
    var timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.textContent = new Date().toLocaleTimeString();
    message.appendChild(timestamp);
  }
  

      
  
  
  // Voice input button click event
  voiceButton.onclick = function () {
    startVoiceRecognition();
  };

  // Image upload button click event
  imageButton.onclick = function () {
    // Trigger the hidden file input when the image button is clicked
    imageInput.click();
  };

  // Handle image selection
  imageInput.onchange = function () {
    var file = imageInput.files[0];
    if (file) {
      // Display the selected image in the chat window
      displayUserImage(file);

      // Send the image to the server for processing
      sendImage(file);

      // Reset the input
      imageInput.value = '';
    }
  };






















  

  
    function sendMessage() {
      var userInput = userInputField.value.trim();
      if (userInput === '') return;

      var chatOptions = document.getElementById("chat-options");
      if (chatOptions) {
        chatOptions.style.display = "none";
      }
  
      var currentTime = new Date();
  
      // Display user's message
      var userMessage = document.createElement('div');
      userMessage.className = 'user-message message';
      userMessage.innerHTML = userInput;
      chatWindow.appendChild(userMessage);
      appendTimestamp(userMessage);
  
      // Clear input
      userInputField.value = '';
  
      // Scroll to bottom
      chatWindow.scrollTop = chatWindow.scrollHeight;
  
      // Show typing indicator
      showTypingIndicator();
  
      // Call backend to get response
      frappe.call({
        method: 'fairbot.api.get_bot_response',
        args: {
          'user_message': userInput
        },
        callback: function (r) {
          // Remove typing indicator
          hideTypingIndicator();
  
          if (r.message) {
            var botMessage = document.createElement('div');
            botMessage.className = 'bot-message message';
            // Format the r.message by adding HTML structure
            var formattedMessage = r.message;

            // Fix extra spaces before colons
            formattedMessage = formattedMessage.replace(/\s+:\s+/g, ": ");

            // Convert **bold text** to <strong>
            formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

            // Convert new lines to <br> for readability
            formattedMessage = formattedMessage.replace(/\n/g, "<br>");

            // Convert numbered lists properly (all items in one <ol>)
            formattedMessage = formattedMessage.replace(/(?:\d+\.\s(.*?))(?:<br>|\n|$)/g, "<li>$1</li>");
            formattedMessage = formattedMessage.replace(/(<li>.*?<\/li>)+/g, "<ol>$&</ol>");

            // Convert unordered lists properly (all items in one <ul>)
            formattedMessage = formattedMessage.replace(/(?:[-*]\s(.*?))(?:<br>|\n|$)/g, "<li>$1</li>");
            formattedMessage = formattedMessage.replace(/(<li>.*?<\/li>)+/g, "<ul>$&</ul>");
            
            botMessage.innerHTML = formattedMessage;
            chatWindow.appendChild(botMessage);
            appendTimestamp(botMessage);
  
            // Scroll to bottom
            chatWindow.scrollTop = chatWindow.scrollHeight;
          }
        },
        error: function (e) {
          // Remove typing indicator
          hideTypingIndicator();
  
          var botMessage = document.createElement('div');
          botMessage.className = 'bot-message message';
          botMessage.innerHTML = 'Sorry, an error occurred.';
          chatWindow.appendChild(botMessage);
          appendTimestamp(botMessage);
  
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    }
  
    function sendImage(file) {
      // Show typing indicator
      // showTypingIndicator();
      var chatOptions = document.getElementById("chat-options");
      if (chatOptions) {
        chatOptions.style.display = "none";
      }
  
      var formData = new FormData();
      formData.append('image', file);
  
      $.ajax({
        url: '/api/method/fairbot.api.process_image',
        type: 'POST',
        data: formData,
        headers: {
          'X-Frappe-CSRF-Token': frappe.csrf_token
        },
        processData: false,
        contentType: false,
        success: function (r) {
          // Remove typing indicator
          hideTypingIndicator();
          
  
          if (r.message) {
            var botMessage = document.createElement('div');
            botMessage.className = 'bot-message message';
            botMessage.innerHTML = r.message.analysis.replace(/\*\*(.*?)\*\*/g, " <b>$1</b> ");
            chatWindow.appendChild(botMessage);
            appendTimestamp(botMessage);
  
            // Scroll to bottom
            chatWindow.scrollTop = chatWindow.scrollHeight;
          }
        },
        error: function (e) {
          // Remove typing indicator
          hideTypingIndicator();
  
          var botMessage = document.createElement('div');
          botMessage.className = 'bot-message message';
          botMessage.innerHTML = 'Sorry, an error occurred.';
          chatWindow.appendChild(botMessage);
          appendTimestamp(botMessage);
  
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    }

    function displayUserImage(file) {
      var reader = new FileReader();
      reader.onload = function (e) {
          var userMessage = document.createElement('div');
          userMessage.className = 'user-message message';
  
          var img = new Image();
          img.src = e.target.result;
          img.style.maxWidth = '200px';
          img.style.borderRadius = '10px';
  
          // Ensure the image is appended before showing typing indicator
          img.onload = function () {
              userMessage.appendChild(img);
              chatWindow.appendChild(userMessage);
              appendTimestamp(userMessage);
              chatWindow.scrollTop = chatWindow.scrollHeight;
  
              // Small delay to ensure image renders first
              setTimeout(showTypingIndicator,100);
          };
      };
      reader.readAsDataURL(file);
  }
  
  
  
    function formatTime(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';
  
      hours = hours % 12;
      hours = hours || 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
  
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    }
  
    function appendTimestamp(messageElement) {
      var timestamp = document.createElement('span');
      timestamp.className = 'timestamp';
      timestamp.textContent = formatTime(new Date());
      messageElement.appendChild(timestamp);
    }
  
    // Voice recognition function using Web Speech API
    function startVoiceRecognition() {
      if (!('webkitSpeechRecognition' in window)) {
        alert('Your browser does not support voice recognition. Please use Google Chrome.');
        return;
      }
  
      if (isRecording) {
        // If already recording, stop the recognition
        recognition.stop();
        isRecording = false;
        voiceButton.innerHTML = '<i class="fas fa-microphone-alt"></i>';
        voiceButton.classList.remove('is-recording');
        return;
      }
  
      isRecording = true;
      voiceButton.innerHTML = '<i class="fas fa-stop-circle"></i>';
      voiceButton.classList.add('is-recording');
  
      var recognition = new webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
  
      recognition.start();
  
      recognition.onstart = function () {
        console.log('Voice recognition started. Try speaking into the microphone.');
      };
  
      recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        userInputField.value = transcript;
        sendMessage();
      };
  
      recognition.onerror = function (event) {
        console.error('Voice recognition error:', event.error);
        isRecording = false;
        voiceButton.innerHTML = '<i class="fas fa-microphone-alt"></i>';
        voiceButton.classList.remove('is-recording');
      };
  
      recognition.onend = function () {
        console.log('Voice recognition ended.');
        isRecording = false;
        voiceButton.innerHTML = '<i class="fas fa-microphone-alt"></i>';
        voiceButton.classList.remove('is-recording');
      };
    }
  
    function showTypingIndicator() {
      if (isTyping) return;
      isTyping = true;
      var typingIndicator = document.createElement('div');
      typingIndicator.className = 'typing-indicator';
      typingIndicator.id = 'typing-indicator';
      typingIndicator.innerHTML = '<i class="fas fa-ellipsis-h"></i> Fairbot is typing...';
      chatWindow.appendChild(typingIndicator);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  
    function hideTypingIndicator() {
      isTyping = false;
      var indicator = document.getElementById('typing-indicator');
      if (indicator) indicator.remove();
    }
  });
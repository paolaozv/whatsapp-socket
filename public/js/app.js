// appp


var cargarPagina = function() {
  var FADE_TIME = 150,
  TYPING_TIMER_LENGTH = 400;
  var COLORS = [
    "#E21400", "#91580F", "#F8a700", "#F78B00",
      "#58DC00", "#287B00", "#A8F07A", "#4AE8C4",
      "#3B88EB", "#3824AA", "#A700FF", "#D300E7"
  ];

  var $window = $(window);
    var $usernameInput = $(".usernameInput");
    var $messages = $(".messages");
    var $inputMessage = $(".inputMessage");
    var $loginPage = $(".login.page");
    var $chatPage = $(".chat.page");
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    var socket = io();

    function addParticipantsMessage(data) {
      var message = "";
      if (data.numUsers === 1) {
          message += "there's 1 participant";
      } else {
          message += "there are " + data.numUsers + " participants";
      }
      log(message);
    }

  function setUsername () {
      var saludo = document.getElementsByClassName("saludo")[0];
      username = saludo.innerText;

      if (username) {
          $loginPage.fadeOut();
          $chatPage.show();
          $loginPage.off("click");
          $currentInput = $inputMessage.focus();
          socket.emit("add-user", username);
          console.log(username);
      }
  }

    function sendMessage () {
      var message = $inputMessage.val();
      message = cleanInput(message);
      if (message && connected) {
          $inputMessage.val("");
          addChatMessage({
            username: username,
            message: " " + message
          });
          socket.emit("new-message", message);
      }
    }

  function log (message, options) {
      var $el = $("<li>").addClass("log").text(message);
      addMessageElement($el, options);
      console.log($el);
  }

    function addChatMessage (data, options) {
      var $typingMessages = getTypingMessages(data);
      options = options || {};
      if ($typingMessages.length !== 0) {
          options.fade = false;
          $typingMessages.remove();
      }

      var $usernameDiv = $('<span class="username"/>')
                  .text(data.username)
                  .css("color", getUsernameColor(data.username));
      var $messageBodyDiv = $('<span class="messageBody">')
                    .text(data.message);

      var typingClass = data.typing ? "typing" : "";
      var $messageDiv = $('<li class="message"/>')
                  .data("username", data.username)
                  .addClass(typingClass)
                  .append($usernameDiv, $messageBodyDiv);

      addMessageElement($messageDiv, options);
    }

    function addChatTyping (data) {
      data.typing = true;
      data.message = " is typing";
      addChatMessage(data);
    }

    function removeChatTyping (data) {
      getTypingMessages(data).fadeOut(function () {
        $(this).remove();
      });
    }

    function addMessageElement (el, options) {
      var $el = $(el);

      if (!options) {
          options = {};
      }
      if (typeof options.fade === "undefined") {
          options.fade = true;
      }
      if (typeof options.prepend === "undefined") {
          options.prepend = false;
      }

      if (options.fade) {
          $el.hide().fadeIn(FADE_TIME);
      }
      if (options.append) {
          $messages.append($el);
      } else {
          $messages.append($el);
      }
      $messages[0].scrollTop = $messages[0].scrollHeight;
  }

    function cleanInput (input) {
      return $("<div/>").text(input).text();
    }

    function updateTyping () {
      if (connected) {
          if (!typing) {
            typing = true;
            socket.emit("typing");
          }
          lastTypingTime = (new Date()).getTime();

          setTimeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit("stop-typing");
                typing = false;
            }
          }, TYPING_TIMER_LENGTH);
      }
    }

    function getTypingMessages (data) {
      return $(".typing.message").filter(function (i) {
          return $(this).data("username") === data.username;
      });
    }

    function getUsernameColor (username) {
      var hash = 7;
      for (var i = 0; i < username.length; i++) {
          hash = username.charCodeAt(i) + (hash << 5) - hash;
      }
      var index = Math.abs(hash % COLORS.length);
      return COLORS[index];
    }

    $window.keydown(function (e) {
      if (!(e.ctrlKey || e.metaKey || e.altKey)) {
          $currentInput.focus();
      }
      if (e.which === 13) {
          if (username) {
            sendMessage();
            socket.emit("stop-typing");
            typing = false;
          } else {
            setUsername();
          }
      }
    });

    $inputMessage.on("input", function() {
      updateTyping();
    });

    $loginPage.click(function () {
      $currentInput.focus();
    });

    $inputMessage.click(function () {
      $inputMessage.focus();
    });

    socket.on("login", function (data) {
      connected = true;
      var message = "Welcome to Socket.IO Chat – ";
      log(message, {
          prepend: true
      });
      addParticipantsMessage(data);
    });

    socket.on("new-message", function (data) {
      addChatMessage(data);
    });

    socket.on("user-joined", function (data) {
      log(data.username + " joined");
      addParticipantsMessage(data);
    });

    socket.on("user-left", function (data) {
      log(data.username + " left");
      addParticipantsMessage(data);
      removeChatTyping(data);
    });
  
    socket.on("typing", function (data) {
      addChatTyping(data);
    });

    socket.on("stop-typing", function (data) {
      removeChatTyping(data);
    });
};

$(document).ready(cargarPagina);
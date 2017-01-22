(function() {
  var uuid = /status\?id=([^&]*)/.exec(window.location.href)[1];
  var interval;
  var doneMessage = "<p>Download link will expire in 10 minutes.\n" +
        '<a href="new">New conversion</a></p>';

  function checkStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "status", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var done = JSON.parse(xhr.responseText).done;
        if (done) {
          window.location.href = "download?id=" + encodeURIComponent(uuid);
          window.clearInterval(interval);
          document.querySelector("#main-content").innerHTML = doneMessage;
        } else {
          console.log("Still processing images, re-checking status in 500 ms...");
        }
      }
    };
    xhr.send(JSON.stringify({ uuid: uuid }));
  };

  interval = window.setInterval(checkStatus, 500);
})();

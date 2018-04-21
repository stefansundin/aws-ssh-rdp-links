setTimeout(function() {
  var meta_region = document.querySelector("meta[name='awsc-mezz-region']")
  var region = meta_region.getAttribute("content")
  var timer = setInterval(function() {
    if (window.location.hash.startsWith("#cluster-details:")) {
      var label = document.querySelector("label[for='endpoint']")
      if (label.classList.contains("awssshrdp-element")) return
      label.classList.add("awssshrdp-element")

      var endpoint = label.nextElementSibling.textContent.split(":")[0]
      var href = `ssh://${endpoint}`
      var link = document.createElement("a")
      link.className = "awssshrdplink"
      link.setAttribute("data-link-text", "Open")
      link.href = href

      var td = document.createElement("td")
      td.appendChild(link)
      var backupbtn = document.getElementById("rs-Redshift-backup-menu-btn")
      backupbtn.parentNode.parentNode.appendChild(td)
    }
  }, 200)
}, 3000)

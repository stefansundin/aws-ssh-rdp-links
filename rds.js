setTimeout(function() {
  if (!document.body.classList.contains("awsui-mezzanine-overrides")) {
    // Note: awsui-mezzanine-overrides isn't immediately present, which is why we have the first timer
    console.log("old console")
    return
  }

  // New redesigned console
  var meta_region = document.querySelector("meta[name='awsc-mezz-region']")
  var region = meta_region.getAttribute("content")
  setInterval(function() {
    if (window.location.hash.startsWith("#dbinstance:") || window.location.hash.startsWith("#cluster:")) {
      var labels = document.querySelectorAll(".awsui-form-field-label")
      for (var i=0; i < labels.length; i++) {
        var label = labels[i]
        var text = label.textContent
        if (text == "Endpoint" || text == "Cluster endpoint" || text == "Reader endpoint") {
          var endpoint = label.nextElementSibling.textContent
          if (!endpoint.endsWith(".rds.amazonaws.com")) {
            // e.g. "Not yet available" if an instance is creating
            continue
          }
          var href = `ssh://${endpoint}`

          if (label.classList.contains("awssshrdp-element")) {
            var link = label.querySelector(".awssshrdplink")
            if (link.href != href) {
              link.href = href
            }
            continue
          }

          var link = document.createElement("a")
          link.className = "awssshrdplink"
          link.setAttribute("data-link-text", "Open")
          link.href = href
          label.appendChild(link)
          label.classList.add("awssshrdp-element")
        }
      }
    }

    if (window.location.hash.startsWith("#cluster:")) {
      var tds = document.querySelectorAll("td:nth-child(1)")

      for (var i=0; i < tds.length; i++) {
        var td = tds[i]
        var db = td.textContent
        var type = "db"
        var href = `ssh://${db}.dummy.${region}.rds.amazonaws.com`

        if (td.classList.contains("awssshrdp-element")) {
          var link = td.querySelector(".awssshrdplink")
          if (link.href != href) {
            link.href = href
          }
          continue
        }

        var th = td.parentElement.parentElement.parentElement.querySelector("th")
        if (!th || th.textContent != "db instance") break

        var link = document.createElement("a")
        link.className = "awssshrdplink cluster"
        link.setAttribute("data-link-text", "Open")
        link.href = href
        td.appendChild(link)
        td.classList.add("awssshrdp-element")
      }
      return
    }
    else if (window.location.hash.startsWith("#dbinstances:")) {
      var links = document.querySelectorAll("td a[href^='#dbinstance:id=']")
      var type = "db"
      var dummy = "dummy"
    }
    else if (window.location.hash.startsWith("#dbclusters:")) {
      var links = document.querySelectorAll("td a[href^='#cluster:ids=']")
      var type = "cluster"
      var dummy = "cluster-ro-dummy"
    }
    else {
      return
    }

    for (var i=0; i < links.length; i++) {
      var href = links[i].getAttribute("href")
      var db = href.substr(href.indexOf("=")+1)
      var td = links[i].parentElement.parentElement
      var href = `ssh://${db}.${dummy}.${region}.rds.amazonaws.com`

      if (td.classList.contains("awssshrdp-element")) {
        var link = td.querySelector(".awssshrdplink")
        if (link.href != href) {
          link.href = href
        }
        continue
      }
      var link = document.createElement("a")
      link.className = "awssshrdplink"
      link.setAttribute("data-link-text", "Open")
      link.href = href
      td.appendChild(link)
      td.classList.add("awssshrdp-element")
    }
  }, 200)
}, 3000)

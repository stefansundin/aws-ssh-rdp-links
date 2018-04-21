var default_options = {
  ssh_user: "ec2-user",
  always_override_user: false,
  rdp_user: "Administrator",
  rdp_style: "MS",
}

var options = {}
function get_options() {
  chrome.storage.sync.get(default_options, function(items) {
    options = items
  })
}

get_options()
chrome.storage.onChanged.addListener(function() {
  get_options()
  // remove all links
  var links = document.querySelectorAll(".awssshrdplink")
  for (var i=0; i < links.length; i++) {
    links[i].parentNode.removeChild(links[i])
  }
  // add new links
  window.setTimeout(go, 10)
})

// poll at a high frequency until the "detailsPublicDNS" element has loaded
// the instance details have finished loaded when this element appears
// after this, rely on the click and keyup events below to add new SSH links when the selection changes
var load_timer = setInterval(function() {
  if (document.getElementById("detailsPublicDNS")) {
    clearInterval(load_timer)
    window.setTimeout(function() {
      go()
    }, 1000)
  }
}, 100)

document.addEventListener("click", function() {
  setTimeout(go, 500)
})
document.addEventListener("keyup", function() {
  setTimeout(go, 1000)
})

function get_selector(row, col) {
  // nth-child is 1-indexed!
  return document.querySelector(`.gwt-TabLayoutPanelContent table > tbody tr:nth-child(${row}) > td:nth-child(${col}) div:nth-child(2)`)
}

function go() {
  if (!window.location.hash.startsWith("#Instances:")) return

  var active_tab = document.querySelector(".gwt-TabLayoutPanelContent > div:not([aria-hidden])")
  if (!active_tab) return

  if (active_tab.children.length == 1 && active_tab.children[0].tagName == "UL") {
    // multiple instances are selected
    var items = active_tab.getElementsByTagName("li")
    for (var i=0; i < items.length; i++) {
      add_to_element(items[i])
    }
  }
  else {
    // a single instance is selected
    var elastic_ips = get_selector(5, 1)
    if (elastic_ips) {
      var list_items = elastic_ips.getElementsByTagName("li")
      for (var i=0; i < list_items.length; i++) {
        add_to_element(list_items[i])
      }
    }

    add_to_element(get_selector(2, 2)) // Public DNS (IPv4)
    add_to_element(get_selector(3, 2)) // IPv4 Public IP
    add_to_element(get_selector(4, 2)) // IPv6 IPs
    add_to_element(get_selector(5, 2)) // Private DNS
    add_to_element(get_selector(6, 2)) // Private IPs
    add_to_element(get_selector(7, 2)) // Secondary private IPs
  }

  // Top bar "Public DNS" / "Private IP" / "Elastic IP"
  // This works for both one instance selected and multiple instances
  var instance = document.querySelector("span[style^='padding-left: 5px;']")
  if (instance) {
    if (instance.textContent.trim() == "Instance:") {
      instance = instance.nextElementSibling
    }
    while (instance) {
      add_to_element(instance)
      instance = instance.nextElementSibling
    }
  }
}

function add_to_element(el) {
  if (!el) return
  if (el.nodeType == 3) {
    var span = document.createElement("span")
    el.parentNode.insertBefore(span, el)
    span.appendChild(el)
    el = span
  }
  if (!el || el.querySelector(".awssshrdplink")) {
    // do not add multiple times
    return
  }

  var text = el.textContent.trim()

  if (text.endsWith(" IPs")) {
    // instances with multiple IPv6 addresses have a link that brings up a popup with the list of addresses ("2 IPs")
    return
  }

  var re
  if ((re=/^i-[0-9a-f]{8,} \(.+\)$/.exec(text)) != null) {
    // the part above the instance details has this format:
    // i-01234567890abcdef (Name tag here)
    var text = el.firstChild
    var name = text.splitText(text.textContent.indexOf(" "))
    add_to_element(text)
    add_to_element(name)
    return
  }
  else if ((re=/^\((.+)\)$/.exec(text)) != null) {
    // the name element from above
    text = re[1].replace(/ /g, "-")
    text = text.replace(/[^a-zA-Z0-9\-.]/g, "") // only allow these characters
  }
  else if ((re=/^(i-[0-9a-f]{8,}): ?(.*)$/.exec(text)) != null) {
    // this is the format that the list has when you select multiple instances:
    // i-01234567890abcdef: ec2-50-70-40-60.compute-1.amazonaws.com
    if (re[2]) {
      var text = el.firstChild
      var dns = text.splitText(text.textContent.indexOf(" "))
      add_to_element(text)
      add_to_element(dns)
      return
    }
    else {
      text = re[1]
    }
  }

  if ((re=/^i-[0-9a-f]{8,}$/.exec(text)) != null) {
    var meta_region = document.querySelector("meta[name='awsc-mezz-region']")
    if (meta_region) {
      text = `${text}-${meta_region.getAttribute("content")}`
    }
  }

  if (text.startsWith("Private IP: ")) {
    text = text.substring("Private IP: ".length)
  }
  else if (text.startsWith("Public DNS: ")) {
    text = text.substring("Public DNS: ".length)
  }
  else if (text.startsWith("Elastic IP: ")) {
    text = text.substring("Elastic IP: ".length)
  }
  else if (text.endsWith("*")) {
    // remove * from EIP
    text = text.substr(0, text.length-1)
  }
  else if (text.includes(",")) {
    // multiple Secondary private IPs; only use the first one
    text = text.substr(0, text.indexOf(","))
  }

  // put IPv6 inside []
  if (text.includes(":")) {
    text = `[${text}]`
  }

  if (text[0] == "-" || text.trim() == "") {
    return
  }

  var link = document.createElement("a")
  link.className = "awssshrdplink"

  var platform = get_selector(10, 1)
  platform = (platform ? platform.textContent : "")
  if (platform == "windows") {
    link.setAttribute("data-link-text", "RDP")
    var user = options["rdp_user"]

    if (options["rdp_style"] == "MS") {
      var query_string_opts = []
      if (user != "") {
        query_string_opts.push("username=s:"+user)
      }
      query_string_opts.push("full%20address=s:"+text+":3389")
      var query_string = query_string_opts.join("&")
      link.href = "rdp://"+query_string
    }
    else if (options["rdp_style"] == "CoRD") {
      link.href = "rdp://"+(user?`${user}@`:"")+text
    }
  }
  else {
    link.setAttribute("data-link-text", "SSH")
    var user = get_ssh_user()
    link.href = "ssh://"+(user?`${user}@`:"")+text
  }

  el.classList.add("awssshrdp-element")
  if (el.children.length > 1) {
    // add link before the copy to clipboard button
    el.insertBefore(link, el.lastChild)
  }
  else {
    el.appendChild(link)
  }
}

function get_ssh_user() {
  if (options["always_override_user"])
    return options["ssh_user"]

  var ami = get_selector(9, 1)
  if (!ami)
    return options["ssh_user"]

  ami = ami.textContent
  if (ami.includes("ubuntu"))
    return "ubuntu"
  else if (ami.includes("amzn"))
    return "ec2-user"
  else if (ami.includes("RHEL"))
    return "ec2-user"
  else if (ami.includes("suse-sles"))
    return "ec2-user"
  else if (ami.toLowerCase().includes("coreos"))
    return "core"
  else if (ami.includes("VyOS"))
    return "vyos"

  return options["ssh_user"]
}

(function () {
  var root = document.documentElement;
  var base = (root.getAttribute("data-api-base") || "https://api.rahatomir.com").replace(/\/$/, "");
  var statusEl = document.getElementById("feed-status");
  var listEl = document.getElementById("feed-list");
  var emptyEl = document.getElementById("feed-empty");
  var searchForm = document.getElementById("search-form");
  var searchInput = document.getElementById("search-input");
  var chips = document.querySelectorAll(".chip");
  var siteFilter = "";

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function siteLabel(site) {
    if (site === "fatua") return "Fatua.kz";
    if (site === "muftyat") return "Muftyat.kz";
    return site || "";
  }

  function renderItems(items) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!items.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "feed-card";
      var img = (item.image_url || "").trim();
      var title = item.title || "Мақала";
      var excerpt = (item.excerpt || item.subtitle || "").trim();
      var url = (item.url || "").trim();
      var source = item.source_label || siteLabel(item.site);
      var html = "";
      if (img) {
        html += '<img src="' + img.replace(/"/g, "&quot;") + '" alt="" loading="lazy" />';
      }
      html += '<div class="feed-card-body">';
      html += '<p class="feed-source">' + source + "</p>";
      html += "<h3>" + title + "</h3>";
      if (excerpt) html += "<p>" + excerpt + "</p>";
      html += '<div class="feed-actions">';
      if (url) {
        html +=
          '<a class="btn" href="' +
          url.replace(/"/g, "&quot;") +
          '" rel="noopener noreferrer" target="_blank">Толық оқу</a>';
      }
      html +=
        '<a class="btn primary" href="https://rahatomir.com/more/ai" rel="noopener noreferrer">AI-ға сұрақ</a>';
      html += "</div></div>";
      li.innerHTML = html;
      listEl.appendChild(li);
    });
  }

  function fetchJson(path) {
    return fetch(base + path, { headers: { Accept: "application/json" } }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function loadFeed() {
    var q = (searchInput && searchInput.value ? searchInput.value : "").trim();
    setStatus("Жүктелуде…");
    var path;
    if (q.length >= 2) {
      path =
        "/api/v1/ai/kb/search?q=" +
        encodeURIComponent(q) +
        "&limit=16" +
        (siteFilter ? "&site=" + encodeURIComponent(siteFilter) : "");
    } else if (siteFilter) {
      path =
        "/api/v1/ai/kb/browse?limit=16&site=" + encodeURIComponent(siteFilter);
    } else {
      path = "/api/v1/ai/kb/home-feed?limit=16";
    }
    fetchJson(path)
      .then(function (data) {
        var items = data.results || [];
        if (!siteFilter || q.length >= 2) {
          renderItems(items);
        } else {
          renderItems(items.filter(function (x) { return x.site === siteFilter; }));
        }
        setStatus(items.length ? items.length + " мақала" : "Мазмұн табылмады");
      })
      .catch(function (err) {
        renderItems([]);
        setStatus("API қатесі: " + (err && err.message ? err.message : "желі"));
      });
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("chip-active"); });
      chip.classList.add("chip-active");
      siteFilter = chip.getAttribute("data-site") || "";
      loadFeed();
    });
  });

  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      loadFeed();
    });
  }

  loadFeed();
})();

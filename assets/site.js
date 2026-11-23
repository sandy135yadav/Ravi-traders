(function () {
  document.documentElement.classList.add("js");

  // Mobile menu
  var header = document.querySelector(".site-header");
  var btn = document.querySelector(".menu-btn");
  if (header && btn) {
    btn.addEventListener("click", function () {
      var open = header.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        header.classList.remove("menu-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Enquiry form (no backend yet: shows a confirmation in the page)
  document.querySelectorAll("form[data-enquiry]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var done = form.querySelector(".form-done");
      if (done) {
        done.hidden = false;
        done.textContent = "Thank you. Our sales team will call you within one working day.";
      }
      form.querySelectorAll("input[type=text], input[type=tel], textarea").forEach(function (i) { i.value = ""; });
    });
  });

  // Coverage map: districts placed by real latitude / longitude
  var SVGNS = "http://www.w3.org/2000/svg";
  var W = 760, H = 380;
  var box = { lonMin: 79.75, lonMax: 84.3, latMin: 26.05, latMax: 27.05 };
  function px(lon, lat) {
    return [
      40 + (lon - box.lonMin) / (box.lonMax - box.lonMin) * (W - 80),
      30 + (box.latMax - lat) / (box.latMax - box.latMin) * (H - 70)
    ];
  }
  var hubs = [
    { name: "Lucknow", lon: 80.95, lat: 26.85, label: "LUCKNOW HUB", sub: "Transport Nagar", dy: -26 },
    { name: "Basti", lon: 82.73, lat: 26.80, label: "BASTI HUB", sub: "2 warehouses", dy: -26 }
  ];
  var towns = [
    { name: "Kanpur", lon: 80.33, lat: 26.45, region: "central", hub: 0, anchor: "end", dx: -14, dy: 5 },
    { name: "Raebareli", lon: 81.24, lat: 26.23, region: "central", hub: 0, anchor: "start", dx: 14, dy: 5 },
    { name: "Faizabad", lon: 82.13, lat: 26.78, region: "east", hub: 1, anchor: "middle", dx: 0, dy: 28 },
    { name: "Gorakhpur", lon: 83.37, lat: 26.76, region: "east", hub: 1, anchor: "middle", dx: 0, dy: 28, n: { anchor: "start", dx: -6, dy: -16 } },
    { name: "Kushinagar", lon: 83.89, lat: 26.74, region: "east", hub: 1, anchor: "middle", dx: 0, dy: -16, n: { anchor: "end", dx: 14, dy: 32 } }
  ];
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(str, attrs, parent) { var t = el("text", attrs, parent); t.textContent = str; return t; }
  function curve(a, b, bend) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - bend;
    return "M" + a[0] + " " + a[1] + " Q" + mx + " " + my + " " + b[0] + " " + b[1];
  }

  document.querySelectorAll("[data-map]").forEach(function (host) {
    var narrow = host.clientWidth < 560;
    W = narrow ? 460 : 760; H = narrow ? 400 : 380;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "map-svg" + (narrow ? " narrow" : ""), role: "img",
      "aria-label": "Coverage map: hubs in Lucknow and Basti serving Kanpur, Raebareli, Faizabad, Gorakhpur and Kushinagar" });
    for (var x = 20; x < W; x += 24) for (var y = 16; y < H; y += 24) el("circle", { cx: x, cy: y, r: 1.4, class: "grid-dot" }, svg);

    var H0 = px(hubs[0].lon, hubs[0].lat), H1 = px(hubs[1].lon, hubs[1].lat);
    // Delhi origin arrow (off-map, to the west)
    el("path", { d: "M8 " + (H0[1] - 70) + " Q" + (H0[0] - 60) + " " + (H0[1] - 90) + " " + (H0[0] - 10) + " " + (H0[1] - 12), class: "route origin" }, svg);
    text(narrow ? "← Delhi, 1996" : "← Delhi · where it began, 1996", { x: 14, y: H0[1] - 80, class: "sm" }, svg);
    // Trunk between the two hubs
    el("path", { d: curve(H0, H1, 46), class: "route trunk" }, svg);

    towns.forEach(function (t) {
      var p = px(t.lon, t.lat), h = t.hub === 0 ? H0 : H1;
      el("path", { d: curve(h, p, t.region === "east" ? 22 : -18), class: "route " + t.region }, svg);
    });
    towns.forEach(function (t) {
      var p = px(t.lon, t.lat);
      el("circle", { cx: p[0], cy: p[1], r: 8, class: "node " + t.region }, svg);
      var o = (narrow && t.n) || t;
      text(t.name, { x: p[0] + o.dx, y: p[1] + o.dy, "text-anchor": o.anchor }, svg);
    });
    hubs.forEach(function (h) {
      var p = px(h.lon, h.lat);
      el("circle", { cx: p[0], cy: p[1], r: 13, class: "hub-ring" }, svg);
      el("circle", { cx: p[0], cy: p[1], r: 13, class: "hub" }, svg);
      text(h.label, { x: p[0], y: p[1] + h.dy - (narrow ? 6 : 14), "text-anchor": "middle", class: "hub-label" }, svg);
      if (!narrow) text(h.sub, { x: p[0], y: p[1] + h.dy + 2, "text-anchor": "middle", class: "sm" }, svg);
    });
    text(narrow ? "+ 13 more districts" : "+ 13 more districts across Eastern & Central UP", { x: W - 20, y: H - 14, "text-anchor": "end", class: "sm" }, svg);
    host.appendChild(svg);
  });

  // Gentle lift-in for sections already visible at rest
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var items = document.querySelectorAll(".reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.top > window.innerHeight) { n.classList.add("pre"); io.observe(n); }
    });
  }
})();

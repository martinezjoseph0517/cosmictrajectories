(function () {
  const canvas = document.getElementById("globe-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // ── Resize canvas to match its CSS box ────────────────────────────────────
  function syncSize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  syncSize();
  window.addEventListener("resize", syncSize);

  // ── Major global shipping routes  [lon, lat] ─────────────────────────────
  const ROUTES = [
    // Trans-Pacific: Los Angeles → Tokyo
    [[-118.2, 33.7], [139.7, 35.7]],
    // Trans-Pacific: Los Angeles → Shanghai
    [[-118.2, 33.7], [121.5, 31.2]],
    // Trans-Atlantic: New York → Rotterdam
    [[-74.0, 40.7], [4.5, 51.9]],
    // Trans-Atlantic: New York → London
    [[-74.0, 40.7], [-0.1, 51.5]],
    // Europe → Asia via Suez: Rotterdam → Singapore
    [[4.5, 51.9], [32.3, 29.9], [43.6, 12.6], [72.9, 18.9], [103.8, 1.3]],
    // Rotterdam → Shanghai (via Suez)
    [[4.5, 51.9], [32.3, 29.9], [103.8, 1.3], [121.5, 31.2]],
    // Singapore → Sydney
    [[103.8, 1.3], [151.2, -33.9]],
    // Singapore → Tokyo
    [[103.8, 1.3], [139.7, 35.7]],
    // Gulf → India → Singapore
    [[56.4, 24.5], [72.9, 18.9], [80.3, 13.1], [103.8, 1.3]],
    // Cape route: Rotterdam → Cape Town → Singapore
    [[4.5, 51.9], [18.4, -33.9], [103.8, 1.3]],
    // East Coast South America: Santos → Rotterdam
    [[-46.3, -23.9], [-43.2, -22.9], [-8.8, -13.0], [4.5, 51.9]],
    // US Gulf → Europe: Houston → Rotterdam
    [[-95.4, 29.7], [-74.0, 40.7], [4.5, 51.9]],
    // China → West Coast Australia
    [[121.5, 31.2], [115.9, -32.0]],
  ];

  // ── D3 projection + path generator ───────────────────────────────────────
  function makeProjection() {
    return d3.geoOrthographic()
      .scale(Math.min(canvas.width, canvas.height) * 0.44)
      .translate([canvas.width / 2, canvas.height / 2])
      .clipAngle(90);
  }

  let projection = makeProjection();
  let path       = d3.geoPath(projection, ctx);
  let rotation   = [10, -20, 0];   // initial rotation [λ, φ, γ]
  let land       = null;
  let graticule  = d3.geoGraticule()();

  // ── Fetch world land data ─────────────────────────────────────────────────
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(function (world) {
      land = topojson.feature(world, world.objects.land);
      requestAnimationFrame(tick);
    })
    .catch(function () {
      // Render without land if fetch fails (e.g. offline)
      requestAnimationFrame(tick);
    });

  // ── Draw one frame ────────────────────────────────────────────────────────
  function draw() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Keep canvas pixels in sync with layout size
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }

    projection = makeProjection();
    projection.rotate(rotation);
    path = d3.geoPath(projection, ctx);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ocean fill
    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.fillStyle = "#020d1a";
    ctx.fill();

    // Graticule grid
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Land masses
    if (land) {
      ctx.beginPath();
      path(land);
      ctx.fillStyle = "#0d2137";
      ctx.fill();
      ctx.strokeStyle = "rgba(232,117,0,0.25)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Shipping lanes
    ROUTES.forEach(function (coords) {
      ctx.beginPath();
      path({ type: "Feature", geometry: { type: "LineString", coordinates: coords } });
      ctx.strokeStyle = "rgba(232,117,0,0.65)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Globe outline
    ctx.beginPath();
    path({ type: "Sphere" });
    ctx.strokeStyle = "rgba(232,117,0,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  function tick() {
    rotation[0] += 0.08;   // slow eastward drift
    draw();
    requestAnimationFrame(tick);
  }
})();

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Tahun di footer
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // tutup saat klik link
    $$("#navMenu a").forEach(a => {
      a.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Klik chip jadwal -> isi input
  $$(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const slot = btn.getAttribute("data-slot") || btn.textContent.trim();
      const input = $("#jadwalPreferensi");
      if (input) input.value = input.value ? input.value : `Pilihan jam: ${slot}`;

      // style picked
      $$(".chip").forEach(b => b.classList.remove("is-picked"));
      btn.classList.add("is-picked");

      input?.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  // Summary live
  const form = $("#regForm");
  const summary = $("#summary");
  if (form && summary) {
    const updateSummary = () => {
      const getVal = (name) => {
        const el = form.elements[name];
        if (!el) return "";
        if (el.type === "checkbox") return "";
        return (el.value || "").trim();
      };

      const mapel = $$('input[name="mapel"]:checked', form).map(x => x.value);
      const fields = {
        namaAnak: getVal("namaAnak"),
        kelas: getVal("kelas"),
        mapel: mapel.length ? mapel.join(", ") : "",
        mode: getVal("mode"),
        jadwalPreferensi: getVal("jadwalPreferensi"),
        namaWali: getVal("namaWali"),
        wa: getVal("wa"),
      };

      $$("[data-sum]", summary).forEach(el => {
        const key = el.getAttribute("data-sum");
        el.textContent = fields[key] ? fields[key] : "-";
      });
    };

    form.addEventListener("input", updateSummary);
    form.addEventListener("change", updateSummary);
    updateSummary();
  }

  // Validasi sederhana
  function setError(name, message) {
    const err = document.querySelector(`[data-error-for="${name}"]`);
    if (err) err.textContent = message || "";
  }

  function normalizeWA(v) {
    return (v || "").replace(/[^\d+]/g, "").trim();
  }

  // Submit: simpan ke localStorage & redirect ke sukses
  if (form) {
    const resetBtn = $("#btnReset");
    resetBtn?.addEventListener("click", () => {
      form.reset();
      // hapus errors
      $$("[data-error-for]").forEach(e => (e.textContent = ""));
      // reset summary
      const summary = $("#summary");
      if (summary) $$("[data-sum]", summary).forEach(el => (el.textContent = "-"));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // clear errors
      ["namaAnak","kelas","mapel","mode","jadwalPreferensi","namaWali","wa"].forEach(k => setError(k, ""));

      const data = {
        namaAnak: (form.namaAnak?.value || "").trim(),
        kelas: (form.kelas?.value || "").trim(),
        mapel: $$('input[name="mapel"]:checked', form).map(x => x.value),
        mode: (form.mode?.value || "").trim(),
        jadwalPreferensi: (form.jadwalPreferensi?.value || "").trim(),
        namaWali: (form.namaWali?.value || "").trim(),
        wa: normalizeWA(form.wa?.value),
        alamat: (form.alamat?.value || "").trim(),
        catatan: (form.catatan?.value || "").trim(),
        createdAt: new Date().toISOString()
      };

      let ok = true;

      if (!data.namaAnak) { setError("namaAnak", "Isi nama anak ya."); ok = false; }
      if (!data.kelas) { setError("kelas", "Pilih kelas dulu."); ok = false; }
      if (!data.mapel.length) { setError("mapel", "Pilih minimal 1 pelajaran."); ok = false; }
      if (!data.mode) { setError("mode", "Pilih mode belajar."); ok = false; }
      if (!data.jadwalPreferensi) { setError("jadwalPreferensi", "Isi jadwal preferensi."); ok = false; }
      if (!data.namaWali) { setError("namaWali", "Isi nama orang tua/wali."); ok = false; }

      // WhatsApp minimal 10 digit
      const digits = data.wa.replace(/[^\d]/g, "");
      if (!digits || digits.length < 10) { setError("wa", "Nomor WA kurang lengkap."); ok = false; }

      if (!ok) return;

      try {
        // simpan ke daftar (history)
        const keyList = "lpceria_registrations";
        const keyLast = "lpceria_last";
        const list = JSON.parse(localStorage.getItem(keyList) || "[]");
        list.unshift(data);
        localStorage.setItem(keyList, JSON.stringify(list));
        localStorage.setItem(keyLast, JSON.stringify(data));
      } catch (_) {
        // kalau localStorage diblok, tetap lanjut
      }

      window.location.href = "sukses.html";
    });
  }

  // Halaman sukses: tampilkan ringkasan
  const lastDataEl = $("#lastData");
  const lastDataBox = $("#lastDataBox");
  if (lastDataEl && lastDataBox) {
    try {
      const data = JSON.parse(localStorage.getItem("lpceria_last") || "null");
      if (data) {
        lastDataBox.hidden = false;

        const items = [
          ["Nama Anak", data.namaAnak],
          ["Kelas", data.kelas],
          ["Mapel", Array.isArray(data.mapel) ? data.mapel.join(", ") : data.mapel],
          ["Mode", data.mode],
          ["Jadwal", data.jadwalPreferensi],
          ["Wali", data.namaWali],
          ["WhatsApp", data.wa],
        ];

        lastDataEl.innerHTML = items
          .map(([k, v]) => `
            <div class="kv">
              <div class="k">${escapeHtml(k)}</div>
              <div class="v">${escapeHtml(v || "-")}</div>
            </div>
          `)
          .join("");
      }
    } catch (_) {}
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
})();

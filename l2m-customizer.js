// l2m-customizer.js
// إضافة مستقلة لـ Moncefdz19/l2m:
// 1) حماية كلمة السر / PIN عبر SHA-256 (الافتراضي: 2026)
// 2) إضافة قسم تعديل الكتابات (مثل حذف/تغيير "قناع مدمج") داخل لوحة التحكم والإعدادات

(function () {
  const STORAGE_KEY = "L2M_CUSTOM_TEXTS_V1";
  const DEFAULT_PIN_SHA256 = "158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab";

  const DEFAULT_DATA = {
    pinSha256: DEFAULT_PIN_SHA256,
    cards: [
      {
        tag: "01 / تصميم تكتيكي متكامل",
        title: "ياقة كاغول عالية بأربطة وأزرار كبس",
        desc: "ياقة مرتفعة بلمسة ستريت وير عصرية مزودة بأربطة سحب قابلة للضبط مع مشابك معدنية مربعة وأزرار كبس، لتمنحك دفئاً وحضوراً قوياً حول الرقبة."
      },
      {
        tag: "02 / حماية مخفية",
        title: "قفازات تحت الهودي",
        desc: "قفازات شتوية مرنة ومخفية بذكاء بين الهودي والبطن، يمكنك إخراجها فوراً عند البرد أو إخفاؤها بكل سهولة."
      },
      {
        tag: "03 / لمسة عملية دقيقة",
        title: "إكسسوارات أربطة وتشطيبات متقنة",
        desc: "أربطة مدعومة بأقفال معدنية أنيقة وحلقات تثبيت موزعة بدقة على القبعة والياقة، تمنح الهودي توازناً بصرياً واضحاً وتفصيلاً مميزاً بدون أي تطريز إضافي."
      },
      {
        tag: "04 / جودة الخامة",
        title: "قماش مولتون أسود فاهي",
        desc: "قماش شتوي فاخر يحافظ على هيكل القصة الفضفاضة (Extra Oversized Fit) والقبعة الضخمة ويمنحك إطلالة راقية."
      }
    ]
  };

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
      const parsed = JSON.parse(raw);
      return {
        pinSha256: parsed.pinSha256 || DEFAULT_PIN_SHA256,
        cards: Array.isArray(parsed.cards) && parsed.cards.length === 4 ? parsed.cards : DEFAULT_DATA.cards
      };
    } catch (_) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  let state = loadData();

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function scrubMaskPhrases() {
    // حذف أو تنظيف أي عبارة "قناع مدمج" / "قناع وجه مدمج" من النصوص الظاهرة عند أول تحميل إذا لم يخصّصها المستخدم
    const targets = document.querySelectorAll("h1, h2, h3, h4, p, span, li, div");
    targets.forEach(el => {
      if (el.closest("#l2m-custom-editor-box")) return;
      if (el.children.length === 0 && el.textContent && /قناع.*مدمج/i.test(el.textContent)) {
        el.textContent = el.textContent.replace(/قناع(?:\s+وجه)?\s*مدمج/gi, "").trim();
      }
    });
  }

  function applyCardsToPage() {
    const detailsSection = document.querySelector("#details, [id*='detail'], [id*='feature']") ||
      Array.from(document.querySelectorAll("section")).find(s => /ENGINEERED DETAILS|لماذا هودي L2M/i.test(s.textContent));

    if (!detailsSection) return;

    // البحث عن البطاقات الأربع داخل القسم
    const candidateCards = Array.from(detailsSection.querySelectorAll("div")).filter(div => {
      const hasHeading = div.querySelector("h3, h4");
      const hasPara = div.querySelector("p");
      return hasHeading && hasPara && div.children.length <= 5 && div.querySelectorAll("h3, h4").length === 1;
    });

    const fourCards = candidateCards.slice(0, 4);
    fourCards.forEach((card, i) => {
      const item = state.cards[i];
      if (!item) return;
      const heading = card.querySelector("h3, h4");
      const para = card.querySelector("p");
      const tagEl = Array.from(card.querySelectorAll("span, p, div")).find(el =>
        el !== heading && el !== para && el.children.length === 0 && /^\s*0?[1-4]\s*\//.test(el.textContent || "")
      );

      if (tagEl && item.tag) tagEl.textContent = item.tag;
      if (heading && item.title) heading.textContent = item.title;
      if (para && item.desc) para.textContent = item.desc;
    });
  }

  function findAdminContainer() {
    const modal = document.querySelector("#adminPanelModal, #adminModal, [id*='admin'][class*='modal'], [id*='admin'][class*='fixed']");
    if (!modal) return null;
    return modal.querySelector("#panel-general, [id*='panel'], .p-6, .space-y-4") || modal;
  }

  function injectEditorIntoAdmin() {
    const container = findAdminContainer();
    if (!container || document.getElementById("l2m-custom-editor-box")) return;

    const box = document.createElement("div");
    box.id = "l2m-custom-editor-box";
    box.style.cssText = "margin-top:16px;padding:14px;border-radius:12px;background:#11131a;color:#f3f4f6;border:1px solid rgba(255,255,255,0.14);direction:rtl;text-align:right;font-family:inherit;";

    box.innerHTML = `
      <div style="font-weight:800;font-size:14px;margin-bottom:10px;color:#ffffff;">تعديل الكتابات وكلمة السر (إضافة L2M)</div>
      <div style="margin-bottom:12px;padding:10px;border-radius:8px;background:#090a0e;border:1px solid rgba(255,255,255,0.08);">
        <label style="display:block;font-size:12px;margin-bottom:6px;color:#d1d5db;">تغيير كلمة السر / PIN (مشفر SHA-256):</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input id="l2mNewPinInput" type="password" placeholder="أدخل كلمة سر جديدة..." style="flex:1;min-width:160px;padding:8px 10px;border-radius:8px;background:#161922;color:#fff;border:1px solid rgba(255,255,255,0.15);" />
          <button id="l2mSavePinBtn" type="button" style="padding:8px 14px;border-radius:8px;background:#ffffff;color:#000;font-weight:700;cursor:pointer;border:none;">حفظ كلمة السر</button>
        </div>
      </div>
      <div id="l2mCardsInputs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;"></div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <button id="l2mSaveTextsBtn" type="button" style="padding:9px 16px;border-radius:8px;background:#10b981;color:#000;font-weight:800;cursor:pointer;border:none;">حفظ وتطبيق الكتابات</button>
        <button id="l2mRemoveMaskBtn" type="button" style="padding:9px 14px;border-radius:8px;background:#27272a;color:#fff;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.15);">حذف عبارة "قناع مدمج"</button>
      </div>
    `;

    container.appendChild(box);

    const cardsWrap = box.querySelector("#l2mCardsInputs");
    cardsWrap.innerHTML = state.cards.map((c, idx) => `
      <div style="padding:10px;border-radius:8px;background:#090a0e;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:6px;">
        <span style="font-size:11px;color:#9ca3af;font-weight:700;">بطاقة #${idx + 1}</span>
        <input id="l2mTag_${idx}" type="text" value="${escapeAttr(c.tag)}" placeholder="الشارة" style="padding:6px 8px;border-radius:6px;background:#161922;color:#fff;border:1px solid rgba(255,255,255,0.12);font-size:12px;" />
        <input id="l2mTitle_${idx}" type="text" value="${escapeAttr(c.title)}" placeholder="العنوان" style="padding:6px 8px;border-radius:6px;background:#161922;color:#fff;border:1px solid rgba(255,255,255,0.12);font-size:12px;font-weight:700;" />
        <textarea id="l2mDesc_${idx}" rows="2" placeholder="الوصف" style="padding:6px 8px;border-radius:6px;background:#161922;color:#fff;border:1px solid rgba(255,255,255,0.12);font-size:12px;">${escapeAttr(c.desc)}</textarea>
      </div>
    `).join("");

    box.querySelector("#l2mSavePinBtn").addEventListener("click", async () => {
      const val = box.querySelector("#l2mNewPinInput").value.trim();
      if (!val) return alert("اكتب كلمة السر الجديدة أولاً.");
      state.pinSha256 = await sha256(val);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      box.querySelector("#l2mNewPinInput").value = "";
      alert("تم تحديث كلمة السر (SHA-256) بنجاح.");
    });

    box.querySelector("#l2mSaveTextsBtn").addEventListener("click", () => {
      state.cards = [0, 1, 2, 3].map(idx => ({
        tag: box.querySelector(`#l2mTag_${idx}`).value.trim(),
        title: box.querySelector(`#l2mTitle_${idx}`).value.trim(),
        desc: box.querySelector(`#l2mDesc_${idx}`).value.trim()
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      applyCardsToPage();
      alert("تم حفظ وتطبيق الكتابات الجديدة!");
    });

    box.querySelector("#l2mRemoveMaskBtn").addEventListener("click", () => {
      state.cards = state.cards.map(c => ({
        ...c,
        title: c.title.replace(/قناع(?:\s+وجه)?\s*مدمج/gi, "").trim(),
        desc: c.desc.replace(/قناع(?:\s+وجه)?\s*مدمج/gi, "").trim()
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      scrubMaskPhrases();
      applyCardsToPage();
      box.querySelectorAll("input, textarea").forEach((inp, i) => {
        const cardIdx = Math.floor(i / 3);
        const fieldIdx = i % 3;
        if (state.cards[cardIdx]) {
          inp.value = fieldIdx === 0 ? state.cards[cardIdx].tag : fieldIdx === 1 ? state.cards[cardIdx].title : state.cards[cardIdx].desc;
        }
      });
      alert("تم حذف عبارة قناع مدمج.");
    });
  }

  function escapeAttr(v) {
    return String(v || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  // حماية التحقق من كلمة السر إذا وجد حقل adminPinInput
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const pinInput = document.getElementById("adminPinInput");
    if (pinInput && (btn.textContent || "").includes("دخول")) {
      const entered = pinInput.value.trim();
      if (entered) {
        const h = await sha256(entered);
        if (h === state.pinSha256) {
          setTimeout(injectEditorIntoAdmin, 150);
        }
      }
    }
    setTimeout(injectEditorIntoAdmin, 200);
  });

  window.addEventListener("DOMContentLoaded", () => {
    scrubMaskPhrases();
    applyCardsToPage();
    injectEditorIntoAdmin();
  });
})();

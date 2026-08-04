/* =========================================================
   MAIN.JS — MARCELINHO
   Utilitários gerais:
   1) Ano dinâmico no rodapé.
   2) Formulário de orçamento (front-only): valida os campos e,
      no envio, NÃO manda para backend nenhum — monta uma mensagem
      e abre o WhatsApp (deep link wa.me) já preenchido.
      O número vem de window.MARCELINHO_CONFIG (definido em products.js).
   ========================================================= */

(function () {
  "use strict";

  // ---- Ano do rodapé ----------------------------------------------------
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Formulário de orçamento -> WhatsApp ------------------------------
  var form = document.getElementById("orcamentoForm");
  if (!form) return;

  var successEl = form.querySelector(".form-success");

  function getConfigNumber() {
    return (window.MARCELINHO_CONFIG && window.MARCELINHO_CONFIG.whatsapp) || "5515997031149";
  }

  function setError(field, message) {
    var wrap = field.closest(".form-field");
    if (!wrap) return;
    wrap.classList.toggle("has-error", !!message);
    var errEl = wrap.querySelector(".form-error");
    if (errEl) errEl.textContent = message || "";
  }

  function validate() {
    var ok = true;
    var nome = form.elements["nome"];
    var interesse = form.elements["interesse"];

    if (!nome.value.trim()) { setError(nome, "Informe seu nome."); ok = false; }
    else setError(nome, "");

    if (!interesse.value.trim()) { setError(interesse, "Diga o que procura."); ok = false; }
    else setError(interesse, "");

    return ok;
  }

  // Limpa o erro assim que o usuário corrige o campo
  form.addEventListener("input", function (e) {
    if (e.target.closest(".form-field.has-error")) setError(e.target, "");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstError = form.querySelector(".form-field.has-error .form-control");
      if (firstError) firstError.focus();
      return;
    }

    var nome = form.elements["nome"].value.trim();
    var interesse = form.elements["interesse"].value.trim();
    var condicao = form.elements["condicao"] ? form.elements["condicao"].value : "";
    var obs = form.elements["mensagem"] ? form.elements["mensagem"].value.trim() : "";

    var msg = "Olá, MARCELINHO! Meu nome é " + nome + ".";
    msg += " Tenho interesse em: " + interesse + ".";
    if (condicao) msg += " Condição preferida: " + condicao + ".";
    if (obs) msg += " Observação: " + obs;

    var url = "https://wa.me/" + getConfigNumber() + "?text=" + encodeURIComponent(msg);

    // Só confirma "abrimos o WhatsApp" se a janela realmente abriu. Se o
    // navegador bloquear o popup (window.open retorna null), navega na própria
    // aba como fallback — nunca mostra sucesso falso.
    var win = window.open(url, "_blank", "noopener");
    if (win) {
      if (successEl) successEl.classList.add("is-visible");
    } else {
      window.location.href = url;
    }
  });
})();

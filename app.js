// app.js

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements Cache ---
    
    // Editor Inputs
    const inputSenderName = document.getElementById('input-sender-name');
    const inputSenderAddress = document.getElementById('input-sender-address');
    const inputSenderSiret = document.getElementById('input-sender-siret');
    
    const inputClientName = document.getElementById('input-client-name');
    const inputClientAddress = document.getElementById('input-client-address');
    const inputQuoteDate = document.getElementById('input-quote-date');
    const inputQuoteNumber = document.getElementById('input-quote-number');
    
    const inputTaxRate = document.getElementById('input-tax-rate');
    
    const itemsContainer = document.getElementById('items-container');
    const btnAddItem = document.getElementById('btn-add-item');
    const btnGeneratePdf = document.getElementById('btn-generate-pdf');

    // Preview Elements
    const previewLogo = document.getElementById('preview-logo');
    const previewSenderName = document.getElementById('preview-sender-name');
    const previewSenderAddress = document.getElementById('preview-sender-address');
    const previewSenderSiret = document.getElementById('preview-sender-siret');
    
    const previewClientName = document.getElementById('preview-client-name');
    const previewClientAddress = document.getElementById('preview-client-address');
    const previewQuoteDate = document.getElementById('preview-quote-date');
    const previewQuoteNumber = document.getElementById('preview-quote-number');
    
    const previewItemsBody = document.getElementById('preview-items-body');
    const previewTotalHt = document.getElementById('preview-total-ht');
    const previewTaxRateDisplay = document.getElementById('preview-tax-rate-display');
    const previewTaxAmount = document.getElementById('preview-tax-amount');
    const previewTotalTtc = document.getElementById('preview-total-ttc');

    // --- State ---
    let items = [
        { id: generateId(), name: 'Développement Web Expérience', qty: 1, price: 500 },
    ];

    // Currency Formatter
    const moneyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

    // --- Initialization ---
    init();

    function init() {
        // Load Sender from LocalStorage safely (prevents 'Access Denied' on file:// protocol)
        let savedSender = {};
        try {
            const rawData = localStorage.getItem('devisSenderData');
            if (rawData) {
                savedSender = JSON.parse(rawData);
            }
        } catch (error) {
            console.warn("LocalStorage n'est pas disponible ou est corrompu :", error);
        }
        
        if (savedSender.name) inputSenderName.value = savedSender.name;
        if (savedSender.address) inputSenderAddress.value = savedSender.address;
        if (savedSender.siret) inputSenderSiret.value = savedSender.siret;

        // Set default date to today safely format 'YYYY-MM-DD'
        inputQuoteDate.value = new Date().toISOString().split('T')[0];

        // Initial Render
        renderEditorItems();
        updatePreview();

        // Setup Event Listeners
        setupListeners();
    }

    // --- Core Functions ---

    function setupListeners() {
        // Form Text Inputs sync
        const textInputs = [
            inputSenderName, inputSenderAddress, inputSenderSiret,
            inputClientName, inputClientAddress, inputQuoteDate, inputQuoteNumber,
            inputTaxRate
        ];

        textInputs.forEach(input => {
            input.addEventListener('input', () => {
                updatePreview();
                if (['input-sender-name', 'input-sender-address', 'input-sender-siret'].includes(input.id)) {
                    saveSenderData();
                }
            });
        });

        // Add Item Button
        btnAddItem.addEventListener('click', (e) => {
            e.preventDefault();
            items.push({ id: generateId(), name: '', qty: 1, price: 0 });
            renderEditorItems();
            updatePreview();
        });

        // Generate PDF
        btnGeneratePdf.addEventListener('click', generatePDF);
    }

    function saveSenderData() {
        const senderData = {
            name: inputSenderName.value,
            address: inputSenderAddress.value,
            siret: inputSenderSiret.value
        };
        try {
            localStorage.setItem('devisSenderData', JSON.stringify(senderData));
        } catch (error) {
            console.warn("Impossible de sauvegarder dans LocalStorage :", error);
        }
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // --- Editor Items Management ---

    function renderEditorItems() {
        itemsContainer.innerHTML = '';
        
        items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-2 p-3 bg-white border border-slate-200 rounded-xl animate-fade-in relative shadow-sm';
            
            row.innerHTML = `
                <div class="col-span-12 items-center flex justify-between mb-1">
                    <span class="text-xs font-semibold text-slate-400">Ligne ${index + 1}</span>
                    <button type="button" class="text-red-400 hover:text-red-600 transition-colors" onclick="window.removeItem('${item.id}')" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div class="col-span-12">
                    <input type="text" class="editor-input w-full" placeholder="Désignation de la prestation" value="${escapeHtml(item.name)}" oninput="window.updateItem('${item.id}', 'name', this.value)">
                </div>
                <div class="col-span-6">
                    <label class="block text-[10px] uppercase text-slate-500 mb-1">Quantité</label>
                    <input type="number" class="editor-input w-full" min="1" value="${item.qty}" oninput="window.updateItem('${item.id}', 'qty', this.value)">
                </div>
                <div class="col-span-6">
                    <label class="block text-[10px] uppercase text-slate-500 mb-1">Prix U. HT</label>
                    <input type="number" class="editor-input w-full" min="0" step="0.01" value="${item.price}" oninput="window.updateItem('${item.id}', 'price', this.value)">
                </div>
            `;
            itemsContainer.appendChild(row);
        });
    }

    // Expose to window for inline onclick handlers inside dynamically generated items
    window.removeItem = (id) => {
        items = items.filter(item => item.id !== id);
        renderEditorItems();
        updatePreview();
    };

    window.updateItem = (id, field, value) => {
        const item = items.find(i => i.id === id);
        if (item) {
            item[field] = field === 'name' ? value : parseFloat(value) || 0;
            updatePreview(); // Trigger live preview recalculation
        }
    };

    // --- Preview Generation ---

    function updatePreview() {
        // Sender
        const senderName = inputSenderName.value || 'Votre Société';
        previewSenderName.textContent = senderName;
        previewSenderAddress.textContent = inputSenderAddress.value || 'Adresse de votre société';
        previewSenderSiret.textContent = inputSenderSiret.value || '';
        
        // Random Logo Avatar based on Sender Name (Dicebear Shapes)
        if (senderName.trim() !== '') {
            previewLogo.src = `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(senderName)}&backgroundColor=ffffff,f1f5f9`;
            previewLogo.classList.remove('hidden');
        } else {
            previewLogo.classList.add('hidden');
        }

        // Client
        previewClientName.textContent = inputClientName.value || 'Nom du Client';
        previewClientAddress.textContent = inputClientAddress.value || 'Adresse du client';
        
        // Meta
        if (inputQuoteDate.value) {
            const dateObj = new Date(inputQuoteDate.value);
            previewQuoteDate.textContent = new Intl.DateTimeFormat('fr-FR').format(dateObj);
        } else {
            previewQuoteDate.textContent = 'JJ/MM/AAAA';
        }
        previewQuoteNumber.textContent = inputQuoteNumber.value || 'DEV-XXXX';

        // Tax Rate display
        const taxRate = parseFloat(inputTaxRate.value) || 0;
        previewTaxRateDisplay.textContent = taxRate;

        // Items and Totals
        previewItemsBody.innerHTML = '';
        let totalHT = 0;

        if (items.length === 0) {
            previewItemsBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-slate-400 italic">Aucun article</td></tr>';
        }

        items.forEach(item => {
            const lineTotal = item.qty * item.price;
            totalHT += lineTotal;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-3 px-4 text-slate-800 break-words w-1/2">${escapeHtml(item.name) || '---'}</td>
                <td class="py-3 px-4 text-center text-slate-600">${item.qty}</td>
                <td class="py-3 px-4 text-right text-slate-600">${moneyFormatter.format(item.price)}</td>
                <td class="py-3 px-4 text-right font-medium text-slate-800">${moneyFormatter.format(lineTotal)}</td>
            `;
            previewItemsBody.appendChild(tr);
        });

        // Totals Calculation
        const taxAmount = totalHT * (taxRate / 100);
        const totalTTC = totalHT + taxAmount;

        previewTotalHt.textContent = moneyFormatter.format(totalHT);
        previewTaxAmount.textContent = moneyFormatter.format(taxAmount);
        previewTotalTtc.textContent = moneyFormatter.format(totalTTC);
    }

    // --- PDF Export ---

    function generatePDF() {
        const element = document.getElementById('invoice-preview');
        const quoteNum = inputQuoteNumber.value || 'Nouveau';
        const clientName = inputClientName.value || 'Client';
        
        // Hide button while generating for better UX (optional but nice)
        btnGeneratePdf.disabled = true;
        btnGeneratePdf.innerHTML = 'Génération en cours...';

        const opt = {
            margin:       0,
            filename:     `Devis_${quoteNum}_${clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // Restore button
            btnGeneratePdf.disabled = false;
            btnGeneratePdf.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Générer le PDF
            `;
        });
    }

    // --- Helpers ---
    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

});

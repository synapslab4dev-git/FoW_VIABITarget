document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SÉLECTION DES ÉLÉMENTS UI ---
    // Écran d'accueil
    const welcomeScreen = document.getElementById('welcome-screen');
    const startSimBtn = document.getElementById('start-sim-btn');
    const showExampleBtn = document.getElementById('show-example-btn');
    const exampleContainer = document.getElementById('example-container');

    // Écran Calculateur
    const calculatorScreen = document.getElementById('calculator-screen');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    
    // Inputs principaux
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const addProductBtn = document.getElementById('add-product-btn');
    
    // Boutons d'action
    const calculateBtn = document.getElementById('calculate-btn');
    const applyAdvancedBtn = document.getElementById('apply-advanced-btn');
    const predictDateBtn = document.getElementById('predict-date-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    // Sections de résultats
    const outputsSection = document.getElementById('outputs-section');
    const seuilValeurSpan = document.getElementById('seuil-valeur');
    const repartitionSeuilUl = document.getElementById('repartition-seuil');
    const resultatStrategiqueDiv = document.getElementById('resultat-strategique');
    const strategiqueValeurSpan = document.getElementById('strategique-valeur');
    const repartitionStrategiqueUl = document.getElementById('repartition-strategique');

    // Inputs avancés et prédiction
    const advancedOptionsSection = document.getElementById('advanced-options-section');
    const beneficeSouhaiteInput = document.getElementById('benefice-souhaite');
    const coussinSecuriteInput = document.getElementById('coussin-securite');
    const predictionInputsContainer = document.getElementById('prediction-inputs-container');
    const startDateInput = document.getElementById('start-date-input');
    const predictionResultDiv = document.getElementById('prediction-result');


    // --- 2. VARIABLES D'ÉTAT (Le cerveau du calculateur) ---
    let baseSeuilCA = 0;
    let currentTargetCA = 0;
    let baseRepartitionPM = [];
    let currentRepartitionTarget = [];
    let margeMoyennePourcentage = 0;

    // --- 3. NAVIGATION ET UI ---
    startSimBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        calculatorScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        outputsSection.style.display = 'none';
    });

    showExampleBtn.addEventListener('click', () => {
        exampleContainer.style.display = exampleContainer.style.display === 'none' ? 'block' : 'none';
    });

    // --- 4. GESTION DES PRODUITS (Ajout/Suppression) ---
    function updateUIMode() {
        const items = document.querySelectorAll('.produit-item');
        items.length > 1 ? produitsContainer.classList.remove('mono-produit') : produitsContainer.classList.add('mono-produit');
    }

    addProductBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.classList.add('produit-item');
        div.innerHTML = `
            <input type="text" class="nom-produit" placeholder="Nom du produit">
            <input type="number" class="prix-vente" placeholder="Prix">
            <input type="number" class="cout-revient" placeholder="Coût">
            <input type="number" class="mix-ventes" placeholder="Mix/10">
            <button class="delete-btn no-print">X</button>
        `;
        produitsContainer.appendChild(div);
        updateUIMode();
    });

    produitsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const items = document.querySelectorAll('.produit-item');
            if (items.length > 1) {
                e.target.parentElement.remove();
                updateUIMode();
            }
        }
    });

    // --- 5. MOTEURS DE CALCUL ---

    // Étape 1 : Calcul du Point Mort
    function calculatePointMort() {
        const cout = parseFloat(coutCampagneInput.value) || 0;
        const items = document.querySelectorAll('.produit-item');
        const produits = [];
        items.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit";
            const prix = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutR = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mix = items.length > 1 ? (parseFloat(item.querySelector('.mix-ventes').value) || 0) : 10;
            if (prix > 0) produits.push({ nom, prix, coutR, mix });
        });

        if (cout <= 0 || produits.length === 0) {
            alert("Remplissez le coût de campagne et au moins un produit.");
            return;
        }

        let margeT = 0, caT = 0, totalMix = 0;
        produits.forEach(p => {
            margeT += (p.prix - p.coutR) * p.mix;
            caT += p.prix * p.mix;
            totalMix += p.mix;
        });

        const margeMoyUnitaire = totalMix > 0 ? margeT / totalMix : 0;
        const caMoyenUnitaire = totalMix > 0 ? caT / totalMix : 0;
        margeMoyennePourcentage = caMoyenUnitaire > 0 ? (margeMoyUnitaire / caMoyenUnitaire) : 0;
        
        if (margeMoyUnitaire <= 0) {
            seuilValeurSpan.textContent = "∞";
            repartitionSeuilUl.innerHTML = "<li>Rentabilité impossible (marge négative ou nulle).</li>";
            outputsSection.style.display = 'block';
            advancedOptionsSection.style.display = 'none';
            resultatStrategiqueDiv.style.display = 'none';
            return;
        }

        const qteTotaleSeuil = cout / margeMoyUnitaire;
        baseSeuilCA = qteTotaleSeuil * caMoyenUnitaire;
        currentTargetCA = baseSeuilCA; 

        baseRepartitionPM = produits.map(p => ({
            nom: p.nom,
            quantite: qteTotaleSeuil * (p.mix / totalMix)
        }));
        currentRepartitionTarget = JSON.parse(JSON.stringify(baseRepartitionPM));

        // Mise à jour de l'UI
        seuilValeurSpan.textContent = `${Math.round(baseSeuilCA).toLocaleString('fr-FR')} FCFA`;
        repartitionSeuilUl.innerHTML = baseRepartitionPM.map(p => `<li><strong>${Math.ceil(p.quantite)}</strong> ${p.nom}</li>`).join('');
        
        outputsSection.style.display = 'block';
        resultatStrategiqueDiv.style.display = 'none';
        beneficeSouhaiteInput.value = '';
        coussinSecuriteInput.value = '';
        
        genererChampsPrediction();
    }

    // Étape 2 : Calcul de l'Objectif Stratégique
    function calculateObjectifStrategique() {
        if (baseSeuilCA <= 0) return;

        const benef = parseFloat(beneficeSouhaiteInput.value) || 0;
        const coussin = parseFloat(coussinSecuriteInput.value) || 0;

        const caAdditionnelPourBenefice = margeMoyennePourcentage > 0 ? (benef / margeMoyennePourcentage) : 0;
        let caAvecBenefice = baseSeuilCA + caAdditionnelPourBenefice;
        
        let caFinal = caAvecBenefice;
        if (coussin > 0 && coussin < 100) {
            caFinal = caAvecBenefice / (1 - (coussin / 100));
        }
        
        currentTargetCA = caFinal;
        const ratio = baseSeuilCA > 0 ? (currentTargetCA / baseSeuilCA) : 0;

        strategiqueValeurSpan.textContent = `${Math.round(currentTargetCA).toLocaleString('fr-FR')} FCFA`;
        
        currentRepartitionTarget = baseRepartitionPM.map(p => ({
            nom: p.nom,
            quantite: p.quantite * ratio
        }));

        repartitionStrategiqueUl.innerHTML = currentRepartitionTarget.map(p => `<li><strong>${Math.ceil(p.quantite)}</strong> ${p.nom}</li>`).join('');
        resultatStrategiqueDiv.style.display = 'block';
    }

    // --- 6. ESTIMATION TEMPORELLE ---
    function genererChampsPrediction() {
        predictionInputsContainer.innerHTML = currentRepartitionTarget.map((p, i) => `
            <div class="prediction-row">
                <label for="vitesse-valeur-${i}">Vitesse pour les <span class="prod-name-label">${p.nom}</span> :</label>
                <input type="number" id="vitesse-valeur-${i}" class="vitesse-valeur" data-index="${i}" placeholder="Quantité">
                <select class="vitesse-unite">
                    <option value="1">Par jour</option>
                    <option value="7">Par semaine</option>
                    <option value="30">Par mois</option>
                </select>
            </div>
        `).join('');
        if (!startDateInput.value) startDateInput.valueAsDate = new Date();
        predictionResultDiv.style.display = 'none';
    }

    function calculatePredictionDate() {
        const rows = document.querySelectorAll('.prediction-row');
        let maxJours = 0;
        const dateDebut = new Date(startDateInput.value);

        if (isNaN(dateDebut.getTime())) {
            alert("Veuillez choisir une date de début valide.");
            return;
        }

        let isAnySpeedEntered = false;
        rows.forEach((row, i) => {
            const v = parseFloat(row.querySelector('.vitesse-valeur').value) || 0;
            const unite = parseFloat(row.querySelector('.vitesse-unite').value);
            if (v > 0) {
                isAnySpeedEntered = true;
                const parJour = v / unite;
                const joursCible = currentRepartitionTarget[i].quantite / parJour;
                if (joursCible > maxJours) maxJours = joursCible;
            }
        });

        if (!isAnySpeedEntered) {
             alert("Veuillez saisir au moins une vitesse de vente.");
             return;
        }

        if (maxJours > 0) {
            const dateFin = new Date(dateDebut);
            dateFin.setDate(dateFin.getDate() + Math.ceil(maxJours));
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            predictionResultDiv.innerHTML = `🏁 Objectif atteint autour du :<br><strong>${dateFin.toLocaleDateString('fr-FR', options)}</strong>`;
            predictionResultDiv.style.display = 'block';
        }
    }

    // --- 7. EXPORT PDF ---
    function downloadPDF() {
        const element = document.getElementById('pdf-content');
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     'Rentacom_Rapport_Simulation.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.documentElement.offsetWidth },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } 
        };
        html2pdf().set(opt).from(element).save();
    }

    // --- 8. ÉCOUTEURS D'ÉVÉNEMENTS ---
    calculateBtn.addEventListener('click', calculatePointMort);
    applyAdvancedBtn.addEventListener('click', calculateObjectifStrategique);
    predictDateBtn.addEventListener('click', calculatePredictionDate);
    downloadPdfBtn.addEventListener('click', downloadPDF);

    // Initialisation
    updateUIMode();
});

document.addEventListener('DOMContentLoaded', () => {

    // --- NAVIGATION ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const appScreen = document.getElementById('app-screen');
    const startAppBtn = document.getElementById('start-app-btn');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');

    startAppBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        appScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        appScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
    });

    // --- LOGIQUE MÉTIER VIABITARGET ---
    const calculateBtn = document.getElementById('calculate-btn');
    const outputsSection = document.getElementById('outputs-section');
    
    // Inputs Charges
    const inputSalaires = document.getElementById('charge-salaires');
    const inputLoyer = document.getElementById('charge-loyer');
    const inputAutres = document.getElementById('charge-autres');
    
    // Inputs Sécurité
    const inputImpots = document.getElementById('sec-impots');
    const inputImprevus = document.getElementById('sec-imprevus');

    // Utilitaires de formatage
    const formatFCFA = (number) => new Intl.NumberFormat('fr-FR').format(Math.round(number)) + ' FCFA';
    const getVal = (input) => parseFloat(input.value) || 0;

    function performMainCalculation() {
        // 1. Calcul des charges fixes pures
        const totalChargesFixes = getVal(inputSalaires) + getVal(inputLoyer) + getVal(inputAutres);

        // 2. Application de la marge de sécurité (Impôts + Imprévus)
        const tauxImpots = getVal(inputImpots) / 100;
        const tauxImprevus = getVal(inputImprevus) / 100;
        
        // Coût de survie = Charges + provision impôts sur ces charges + coussin sur ces charges
        const coutDeSurvie = totalChargesFixes * (1 + tauxImpots + tauxImprevus);

        // 3. Affichage du Point de Bascule
        document.getElementById('result-survie-total').textContent = formatFCFA(coutDeSurvie);

        // 4. Calcul des cibles de vente par produit
        for (let i = 1; i <= 3; i++) {
            const nomProduit = document.getElementById(`prod${i}-nom`).value || `Offre ${i}`;
            const margeProduit = getVal(document.getElementById(`prod${i}-marge`));
            
            const cardDOM = document.getElementById(`card-prod${i}`);
            const nomDOM = document.getElementById(`result-prod${i}-nom`);
            const ventesDOM = document.getElementById(`result-prod${i}-ventes`);

            nomDOM.textContent = nomProduit;

            if (margeProduit > 0 && coutDeSurvie > 0) {
                // On arrondit toujours à l'entier supérieur pour la survie
                const ventesRequises = Math.ceil(coutDeSurvie / margeProduit);
                ventesDOM.textContent = ventesRequises;
                cardDOM.style.display = 'block';
            } else if (margeProduit === 0 && document.getElementById(`prod${i}-marge`).value !== "") {
                ventesDOM.textContent = "∞";
                cardDOM.style.display = 'block';
            } else {
                // Masquer la carte si le produit n'est pas renseigné
                cardDOM.style.display = 'none';
            }
        }

        // Afficher la section des résultats
        outputsSection.style.display = 'block';
        
        // Scroll fluide vers les résultats
        outputsSection.scrollIntoView({ behavior: 'smooth' });
    }

    calculateBtn.addEventListener('click', performMainCalculation);

});

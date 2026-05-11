const API_KEY = '0dc64ed4d5db4477a23664d96c4b9657';

// Elementos
const gameContainer = document.getElementById("game-container");
const favoritesContainer = document.getElementById("favorites-container");
const wishlistContainer = document.getElementById("wishlist-container");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("btn-search");

// Elementos Modal
const reviewScreen = document.getElementById("review-screen");
const reviewGameCover = document.getElementById("review-game-cover");
const reviewGameTitle = document.getElementById("review-game-title");
const stars = document.querySelectorAll('.star-rating i');
const selectedRatingInput = document.getElementById('selected-rating');
const ratingText = document.getElementById('rating-text');
const inputReview = document.getElementById("user-review");
const btnSaveReview = document.getElementById("btn-save-review");
const platinumCheck = document.getElementById("platinum-check"); // NOVO

// Listas (Review e Wishlist separadas)
let myReviews = JSON.parse(localStorage.getItem('gamerboxdList')) || [];
let myWishlist = JSON.parse(localStorage.getItem('gamerboxdWishlist')) || [];
let tempGame = {}; 

// --- NAVEGAÇÃO ENTRE ABAS ---
function switchTab(tabName) {
    const diarySection = document.getElementById('diary-section');
    const wishlistSection = document.getElementById('wishlist-section');
    const links = document.querySelectorAll('.nav-link');

    // Remove classe active de todos
    links.forEach(link => link.classList.remove('active'));

    if (tabName === 'diary') {
        diarySection.style.display = 'block';
        wishlistSection.style.display = 'none';
        links[0].classList.add('active'); // Marca o primeiro link
        renderFavorites();
    } else if (tabName === 'wishlist') {
        diarySection.style.display = 'none';
        wishlistSection.style.display = 'block';
        links[1].classList.add('active'); // Marca o segundo link
        renderWishlist();
    }
}

// --- BUSCA ---
async function getGames(searchterm = '') {
    const url = searchterm 
        ? `https://api.rawg.io/api/games?key=${API_KEY}&search=${searchterm}&page_size=12`
        : `https://api.rawg.io/api/games?key=${API_KEY}&dates=2024-01-01,2025-12-31&ordering=-added&page_size=12`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        displayCatalog(data.results);
    } catch (error) { console.error(error); }
}

function displayCatalog(games) {
    gameContainer.innerHTML = '';
    games.forEach(game => {
        const card = document.createElement("div");
        card.classList.add("game-card");
        const image = game.background_image || 'https://via.placeholder.com/300x450';
        
        // Verifica se já tá na wishlist pra pintar o botão
        const isWished = myWishlist.some(g => g.id == game.id);
        const wishClass = isWished ? 'btn-wishlist active' : 'btn-wishlist';

        card.innerHTML = `
            <img src="${image}" alt="${game.name}">
            <div class="card-overlay">
                <div class="game-title">${game.name}</div>
                
                <div class="overlay-buttons">
                    <button class="btn-overlay" onclick="openNewReview('${game.id}', '${game.name}', '${image}')">
                        REVIEW
                    </button>
                    <button class="${wishClass}" onclick="toggleWishlist('${game.id}', '${game.name}', '${image}', this)" title="Quero Jogar">
                        <i class="fas fa-clock"></i>
                    </button>
                </div>
            </div>
        `;
        gameContainer.appendChild(card);
    });
}

// --- LÓGICA WISHLIST (QUERO JOGAR) ---
function toggleWishlist(id, name, image, btnElement) {
    const index = myWishlist.findIndex(g => g.id == id);

    if (index > -1) {
        myWishlist.splice(index, 1);
        if(btnElement) btnElement.classList.remove('active');
        alert("Removido da lista de desejos.");
    } else {
        myWishlist.push({ id, name, image, addedAt: new Date() });
        if(btnElement) btnElement.classList.add('active');
        alert("Adicionado ao Quero Jogar!");
    }
    localStorage.setItem('gamerboxdWishlist', JSON.stringify(myWishlist));
    renderWishlist();
}

function renderWishlist() {
    wishlistContainer.innerHTML = '';
    if (myWishlist.length === 0) {
        wishlistContainer.innerHTML = '<p style="color:#666; width:100%; text-align:center;">Sua lista de desejos está vazia.</p>';
        return;
    }
    myWishlist.forEach(game => {
        const card = document.createElement("div");
        card.classList.add("game-card");
        
        card.innerHTML = `
            <img src="${game.image}" alt="${game.name}">
            <div class="card-overlay">
                <div class="game-title">${game.name}</div>
                <div class="overlay-buttons">
                    <button class="btn-overlay" onclick="openNewReview('${game.id}', '${game.name}', '${game.image}')">
                        JOGUEI! (REVIEW)
                    </button>
                    <button class="btn-icon delete" onclick="toggleWishlist('${game.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        wishlistContainer.appendChild(card);
    });
}
// --- REVIEW E PLATINA ---
function openNewReview(id, name, image) {
    if (myReviews.some(game => game.id == id)) {
        openEditReview(id);
        return;
    }
    tempGame = { id, name, image };
    resetReviewForm();
    reviewGameCover.src = image;
    reviewGameTitle.innerText = name;
    btnSaveReview.innerText = "SALVAR REVIEW";
    reviewScreen.style.display = "block";
}
function openEditReview(id) {
    const gameToEdit = myReviews.find(game => game.id == id);
    if (!gameToEdit) return;

    tempGame = { ...gameToEdit };
    
    reviewGameCover.src = tempGame.image;
    reviewGameTitle.innerText = tempGame.name;
    
    inputReview.value = tempGame.userReview;
    selectedRatingInput.value = tempGame.userRating;
    ratingText.innerText = `Nota: ${tempGame.userRating}/5`;
    
    // Carrega o estado da Platina
    platinumCheck.checked = tempGame.platinum === true;
    
    updateStarVisuals(tempGame.userRating);
    btnSaveReview.innerText = "ATUALIZAR";
    
    reviewScreen.style.display = "block";
}

function closeReviewScreen() { reviewScreen.style.display = "none"; }

function resetReviewForm() {
    selectedRatingInput.value = '0';
    ratingText.innerText = 'Clique nas estrelas';
    inputReview.value = '';
    platinumCheck.checked = false;
    updateStarVisuals(0);
}

// Estrelas
stars.forEach(star => {
    star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-rating'));
        selectedRatingInput.value = rating;
        ratingText.innerText = `Nota: ${rating}/5`;
        updateStarVisuals(rating);
    });
});

function updateStarVisuals(rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= rating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

// Salvar Review
btnSaveReview.addEventListener('click', () => {
    const userRating = selectedRatingInput.value;
    const userReview = inputReview.value;
    const isPlatinum = platinumCheck.checked; // Pega o valor do checkbox

    if (userRating === '0') { alert("Nota é obrigatória!"); return; }

    const finalGameData = { 
        ...tempGame, 
        userRating, 
        userReview,
        platinum: isPlatinum // Salva a platina
    };

    const index = myReviews.findIndex(g => g.id == finalGameData.id);
    if (index > -1) {
        myReviews[index] = finalGameData;
    } else {
        myReviews.unshift(finalGameData);
        // Se jogou e fez review, remove da wishlist automaticamente
        const wishIndex = myWishlist.findIndex(g => g.id == finalGameData.id);
        if(wishIndex > -1) {
            myWishlist.splice(wishIndex, 1);
            localStorage.setItem('gamerboxdWishlist', JSON.stringify(myWishlist));
        }
    }
    
    localStorage.setItem('gamerboxdList', JSON.stringify(myReviews));
    renderFavorites();
    closeReviewScreen();
});

// Renderizar Diário
function renderFavorites() {
    favoritesContainer.innerHTML = '';
    
    myReviews.forEach(game => {
        const card = document.createElement("div");
        card.classList.add("game-card");
        
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += i <= game.userRating 
                ? '<i class="fas fa-star" style="color: var(--accent-orange); font-size: 0.8rem;"></i>' 
                : '<i class="far fa-star" style="color: var(--text-main); font-size: 0.8rem;"></i>';
        }

        // LÓGICA DO TROFÉU
        const trophyHTML = game.platinum ? '<i class="fas fa-trophy trophy-badge" title="Platinado!"></i>' : '';

        // Agora clicando na CAPA abre a review completa (openEditReview)
        card.innerHTML = `
            <div class="user-rating-badge" style="background: rgba(0,0,0,0.8); border: none;">
                ${starsHTML} ${trophyHTML}
            </div>
            <img src="${game.image}" alt="${game.name}" onclick="openEditReview('${game.id}')"> <div class="card-overlay">
                <div class="game-title">${game.name}</div>
                <div style="font-size: 0.7rem; color: #ccc; margin-bottom: 5px; font-style: italic;">
                    "${game.userReview ? game.userReview.substring(0, 40) + '...' : ''}"
                </div>
                
                <div class="card-actions">
                    <button class="btn-icon edit" onclick="openEditReview('${game.id}')" title="Ver Completo / Editar">
                        <i class="fas fa-eye"></i> </button>
                    <button class="btn-icon delete" onclick="removeGame('${game.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        favoritesContainer.appendChild(card);
    });
}

function removeGame(id) {
    if (confirm('Deletar review?')) {
        myReviews = myReviews.filter(game => game.id != id);
        localStorage.setItem('gamerboxdList', JSON.stringify(myReviews));
        renderFavorites();
    }
}

// Eventos Iniciais
searchBtn.addEventListener('click', () => getGames(searchInput.value));
searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') getGames(searchInput.value) });

// Start
getGames();
renderFavorites();
switchTab('diary'); // Começa na aba Diário

// Système d'animations pour les cartes - Fun et moderne
class CardAnimations {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        } else {
            this.setupAnimations();
        }
        
        this.initialized = true;
    }

    setupAnimations() {
        // Animation cascade pour la grille de cartes
        this.observeCardGrid();
        
        // Animation pour les popups d'interprétation
        this.observePopups();
        
        // Effets sonores légers (optionnel)
        this.setupSoundEffects();
    }

    observeCardGrid() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    // Animation en cascade
                    this.triggerCascadeAnimation(entry.target);
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '50px'
        });

        // Observer toutes les grilles de cartes
        document.querySelectorAll('.cards-selection-grid').forEach(grid => {
            observer.observe(grid);
        });
    }

    triggerCascadeAnimation(grid) {
        const cards = grid.querySelectorAll('.card-selection-frame');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-30px) scale(0.8)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        });
    }

    observePopups() {
        // Observer les changements dans le DOM pour détecter les nouvelles popups
        const popupObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Popup d'interprétation
                        if (node.classList?.contains('interpretation-popup') || 
                            node.querySelector?.('.interpretation-popup')) {
                            setTimeout(() => {
                                this.animateInterpretationPopup(node);
                                this.addVideoBackgroundToPopup(node, 'interpretation-popup');
                            }, 100);
                        }
                        
                        // Popup de tarot
                        if (node.classList?.contains('tarot-popup') || 
                            node.querySelector?.('.tarot-popup')) {
                            setTimeout(() => {
                                this.animateTarotPopup(node);
                                this.addVideoBackgroundToPopup(node, 'tarot-popup');
                            }, 100);
                        }

                        // Popup de sélection de cartes (détection par le contenu)
                        if (node.textContent?.includes('Choisissez vos') && 
                            (node.textContent?.includes('cartes') || node.querySelector?.('h2')?.textContent?.includes('cartes'))) {
                            setTimeout(() => {
                                this.addVideoBackgroundToPopup(node, 'card-selection-popup');
                            }, 100);
                        }
                    }
                });
            });
        });

        popupObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    animateInterpretationPopup(popup) {
        const container = popup.classList?.contains('interpretation-popup') ? 
                         popup : popup.querySelector('.interpretation-popup');
        
        if (!container) return;

        container.classList.add('show');
        
        const cards = container.querySelectorAll('.card-image');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.3) rotateY(180deg)';
            
            setTimeout(() => {
                card.style.transition = 'all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                card.style.opacity = '1';
                card.style.transform = 'scale(1) rotateY(0deg)';
            }, index * 200 + 300);
        });
    }

    animateTarotPopup(popup) {
        const container = popup.classList?.contains('tarot-popup') ? 
                         popup : popup.querySelector('.tarot-popup');
        
        if (!container) return;

        // Animation d'ouverture de popup
        container.style.opacity = '0';
        container.style.transform = 'scale(0.8) translateY(-20px)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            container.style.opacity = '1';
            container.style.transform = 'scale(1) translateY(0)';
        }, 50);
    }

    setupSoundEffects() {
        // Effets sonores légers pour l'interaction (optionnel)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card-selection-frame')) {
                this.playCardSound();
            }
        });
    }

    playCardSound() {
        // Son léger de carte (peut être activé plus tard)
        // const audio = new Audio('/sounds/card-flip.wav');
        // audio.volume = 0.1;
        // audio.play().catch(() => {}); // Ignorer les erreurs de lecture
    }

    // Méthode pour activer manuellement l'animation d'une grille
    showCardGrid(gridSelector) {
        const grid = document.querySelector(gridSelector);
        if (grid) {
            grid.classList.add('show');
            this.triggerCascadeAnimation(grid);
        }
    }

    // Méthode pour animer une carte spécifique
    animateCard(cardElement, animationType = 'reveal') {
        if (!cardElement) return;

        switch (animationType) {
            case 'reveal':
                cardElement.classList.add('card-reveal');
                break;
            case 'glow':
                cardElement.style.animation = 'cardGlow 2s ease-in-out infinite';
                break;
            case 'float':
                cardElement.style.animation = 'cardFloating 6s ease-in-out infinite';
                break;
        }
    }

    // Méthode pour ajouter la vidéo de fond aux popups de tarot
    addVideoBackgroundToPopup(popupNode, popupType) {
        try {
            // Trouve le conteneur de popup correct
            let popup = popupNode;
            
            // Pour les popups classiques avec classe CSS
            if (popupType !== 'card-selection-popup') {
                popup = popupNode.classList?.contains(popupType) ? 
                       popupNode : popupNode.querySelector(`.${popupType}`);
            }
            
            if (!popup) return;

            // Vérifie si la vidéo n'existe pas déjà
            if (popup.querySelector('.popup-video-background')) return;

            // Détermine la vidéo à utiliser selon le type de popup
            let videoSrc = '/public/roule.mp4'; // Par défaut pour interprétation et sélection de cartes
            
            // Si c'est un popup de choix de thèmes/tirages (tarot-popup), utilise hero.mp4
            if (popupType === 'tarot-popup') {
                videoSrc = '/public/hero.mp4';
            }

            // Crée l'élément vidéo de fond
            const video = document.createElement('video');
            video.className = 'popup-video-background';
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsinline = true;

            // Ajoute la source vidéo
            const source = document.createElement('source');
            source.src = videoSrc;
            source.type = 'video/mp4';
            video.appendChild(source);

            // Crée l'overlay
            const overlay = document.createElement('div');
            overlay.className = 'popup-video-overlay';

            // Insère la vidéo et l'overlay au début du popup
            popup.insertBefore(overlay, popup.firstChild);
            popup.insertBefore(video, popup.firstChild);

            console.log(`Vidéo de fond ${videoSrc} ajoutée au popup ${popupType}`);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la vidéo de fond:', error);
        }
    }
}

// Initialiser les animations quand le script est chargé
const cardAnimations = new CardAnimations();

// Exposer globalement pour utilisation dans d'autres scripts
window.CardAnimations = cardAnimations;

// Méthodes utilitaires globales
window.animateCardGrid = (selector) => cardAnimations.showCardGrid(selector);
window.animateCard = (element, type) => cardAnimations.animateCard(element, type);
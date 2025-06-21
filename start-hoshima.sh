#!/bin/bash

echo "🚀 =================================="
echo "🚀 DÉMARRAGE HOSHIMA COMPLET"
echo "🚀 =================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si MongoDB est installé et en cours d'exécution
print_status "Vérification de MongoDB..."
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB n'est pas installé ou n'est pas dans le PATH"
    print_status "Installation recommandée: https://docs.mongodb.com/manual/installation/"
    print_status "Continuons quand même (mode dégradé possible)..."
else
    print_success "MongoDB trouvé"
    
    # Vérifier si MongoDB fonctionne
    if pgrep -x "mongod" > /dev/null; then
        print_success "MongoDB est déjà en cours d'exécution"
    else
        print_status "Démarrage de MongoDB..."
        # Essayer de démarrer MongoDB en arrière-plan
        mongod --fork --logpath /tmp/mongod.log --dbpath ~/data/db 2>/dev/null || {
            print_warning "Impossible de démarrer MongoDB automatiquement"
            print_status "Démarrez MongoDB manuellement: mongod"
        }
    fi
fi

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p ~/data/db 2>/dev/null

print_status "Vérification des dépendances..."

# Installer les dépendances du backend si nécessaire
if [ ! -d "backend/node_modules" ]; then
    print_status "Installation des dépendances backend..."
    cd backend && npm install
    cd ..
    print_success "Dépendances backend installées"
else
    print_success "Dépendances backend OK"
fi

# Installer les dépendances du frontend si nécessaire
if [ ! -d "hoshima-project/node_modules" ]; then
    print_status "Installation des dépendances frontend..."
    cd hoshima-project && npm install
    cd ..
    print_success "Dépendances frontend installées"
else
    print_success "Dépendances frontend OK"
fi

# Fonction pour nettoyer les processus en arrière-plan
cleanup() {
    print_status "Arrêt des services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    print_success "Services arrêtés"
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGINT SIGTERM

print_status "Démarrage du backend (port 3001)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
sleep 3

print_status "Démarrage du frontend (port 5173)..."
cd hoshima-project
npm run dev &
FRONTEND_PID=$!
cd ..

# Attendre que le frontend soit prêt
sleep 5

echo ""
echo "🚀 =================================="
echo "🚀 HOSHIMA DÉMARRÉ AVEC SUCCÈS !"
echo "🚀 =================================="
echo ""
print_success "Backend: http://localhost:3001"
print_success "Frontend: http://localhost:5173"
echo ""
print_status "🧠 Système de mémoire IA activé"
print_status "🎭 Silas Vance attend vos défis..."
echo ""
print_warning "Appuyez sur Ctrl+C pour arrêter les services"
echo ""

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID 
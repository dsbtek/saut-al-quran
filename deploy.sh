#!/bin/bash

# Saut Al-Qur'an Deployment Script
# This script helps deploy the application in different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Dependencies check passed!"
}

# Create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating default .env file..."
        cat > .env << EOF
# Database Configuration
POSTGRES_USER=dsbtek
POSTGRES_PASSWORD=dsb.tek_01
POSTGRES_DB=sautalquran
DATABASE_URL=postgresql://dsbtek:dsb.tek_01@db:5432/sautalquran

# Backend Configuration
SECRET_KEY=kutubujad
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
EOF
        print_warning "Please review and update the .env file with your settings!"
        print_warning "Especially change the SECRET_KEY and passwords for production!"
    else
        print_status ".env file found."
    fi
}

# Development deployment
deploy_dev() {
    print_status "Starting development deployment..."
    
    # Build and start services
    docker compose up --build -d
    
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        print_status "Development deployment successful!"
        print_status "Frontend: http://localhost:3000"
        print_status "Backend API: http://localhost:8000/docs"
        print_status "Database: localhost:5432"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Production deployment
deploy_prod() {
    print_status "Starting production deployment..."
    
    # Check if production env file exists
    if [ ! -f .env.production ]; then
        print_error "Production environment file (.env.production) not found!"
        print_error "Please create .env.production with production settings."
        exit 1
    fi
    
    # Use production environment
    cp .env.production .env
    
    # Build and start services
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    
    print_status "Production deployment initiated!"
    print_warning "Make sure to configure reverse proxy (nginx) for production!"
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    docker compose down
    print_status "Services stopped."
}

# Clean up (remove containers, volumes, images)
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker compose down -v --rmi all
        print_status "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Show logs
show_logs() {
    docker compose logs -f
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    print_status "Running backend tests..."
    docker compose exec backend pytest test_main.py -v
    
    # Frontend tests
    print_status "Running frontend tests..."
    docker compose exec frontend npm test -- --coverage --watchAll=false
    
    print_status "Tests completed!"
}

# Show help
show_help() {
    echo "Saut Al-Qur'an Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev       Start development environment"
    echo "  prod      Start production environment"
    echo "  stop      Stop all services"
    echo "  cleanup   Remove all containers, volumes, and images"
    echo "  logs      Show service logs"
    echo "  test      Run tests"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Start development environment"
    echo "  $0 stop     # Stop all services"
    echo "  $0 logs     # Show logs"
}

# Main script logic
main() {
    case "${1:-help}" in
        "dev")
            check_dependencies
            setup_env
            deploy_dev
            ;;
        "prod")
            check_dependencies
            deploy_prod
            ;;
        "stop")
            stop_services
            ;;
        "cleanup")
            cleanup
            ;;
        "logs")
            show_logs
            ;;
        "test")
            run_tests
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"

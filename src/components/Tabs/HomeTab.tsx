import { Camera, Heart, MessageCircle, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HomeTab = () => {
  // Mock data para demonstração
  const recentPhotos = [
    { id: 1, name: "Marina", age: 28, location: "São Paulo", image: "photo-1649972904349-6e44c42644a7" },
    { id: 2, name: "Carlos", age: 32, location: "Rio de Janeiro", image: "photo-1581091226825-a6a2a5aee158" },
    { id: 3, name: "Ana", age: 25, location: "Belo Horizonte", image: "photo-1721322800607-8c38375eef04" },
    { id: 4, name: "Ricardo", age: 35, location: "Salvador", image: "photo-1470071459604-3b5ec3a7fe05" },
  ];

  const topUsers = [
    { id: 1, name: "Isabella", age: 27, location: "São Paulo", online: true },
    { id: 2, name: "Gabriel", age: 30, location: "Rio de Janeiro", online: true },
    { id: 3, name: "Sophia", age: 24, location: "Curitiba", online: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bloco Inicial - Hero Section */}
      <div className="glass rounded-3xl p-6 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-gradient">
          Encontre pessoas Casadas e Solteiras
        </h2>
        <p className="text-lg text-foreground/90">
          na maior rede social adulta do Brasil.
        </p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          9.838 mil de pessoas reais perto de você
        </p>
        
        <Button className="btn-premium w-full text-lg py-4 mt-4">
          Descobrir Perfis
        </Button>
      </div>

      {/* Ranking Top Sensuais Online */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gradient">Top Sensuais Online</h3>
        </div>
        
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-xl glass hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                    {user.name[0]}
                  </div>
                  {user.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.name}, {user.age}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.location}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-accent">#{index + 1}</span>
                <Button size="sm" variant="ghost" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessão Últimas Fotos */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Últimas Fotos</h3>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80">
            Mais fotos →
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {recentPhotos.map((photo) => (
            <div key={photo.id} className="relative group cursor-pointer">
              <div className="aspect-[3/4] rounded-2xl bg-gradient-secondary overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/${photo.image}?w=400&h=600&fit=crop`}
                  alt={photo.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-medium text-white">{photo.name}, {photo.age}</p>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {photo.location}
                    </p>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0">
                    <Heart className="w-4 h-4 text-white" />
                  </Button>
                  <Button size="sm" className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed de Atividades Recentes */}
      <div className="card-premium">
        <h3 className="text-lg font-semibold text-gradient mb-4">Atividade Recente</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl glass">
            <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
              L
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">Luna</span> curtiu sua foto
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                há 2 minutos
              </p>
            </div>
            <Heart className="w-5 h-5 text-accent" />
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl glass">
            <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
              M
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">Marcus</span> visitou seu perfil
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                há 5 minutos
              </p>
            </div>
            <div className="w-5 h-5 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
};
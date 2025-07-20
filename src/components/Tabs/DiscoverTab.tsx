import { Search, Filter, MapPin, Heart, MessageCircle, UserPlus, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const DiscoverTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data para demonstração
  const users = [
    { id: 1, name: "Valentina", age: 26, location: "São Paulo, SP", distance: "2 km", interests: ["Arte", "Música"], premium: true, online: true },
    { id: 2, name: "Diego", age: 29, location: "Rio de Janeiro, RJ", distance: "5 km", interests: ["Esportes", "Viagem"], premium: false, online: true },
    { id: 3, name: "Camila", age: 31, location: "Belo Horizonte, MG", distance: "8 km", interests: ["Culinária", "Livros"], premium: true, online: false },
    { id: 4, name: "André", age: 34, location: "Salvador, BA", distance: "12 km", interests: ["Música", "Dança"], premium: false, online: true },
    { id: 5, name: "Larissa", age: 28, location: "Curitiba, PR", distance: "15 km", interests: ["Fotografia", "Arte"], premium: true, online: false },
  ];

  const filters = [
    { id: 'gender', label: 'Gênero', options: ['Feminino', 'Masculino', 'Não-binário'] },
    { id: 'age', label: 'Idade', options: ['18-25', '26-35', '36-45', '46+'] },
    { id: 'status', label: 'Status', options: ['Solteiro(a)', 'Casado(a)', 'Relacionamento aberto'] },
    { id: 'interests', label: 'Interesses', options: ['Arte', 'Música', 'Esportes', 'Viagem', 'Culinária'] },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header com busca */}
      <div className="glass rounded-2xl p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input/50 border-white/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-white/20 ${showFilters ? 'bg-primary/20 border-primary/40' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="space-y-3 pt-4 border-t border-white/10 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Filtros Avançados</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {filters.map((filter) => (
                <div key={filter.id} className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{filter.label}</label>
                  <select className="w-full p-2 rounded-lg bg-input/50 border border-white/20 text-sm text-foreground">
                    <option value="">Todos</option>
                    {filter.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-3">
              <Button size="sm" className="btn-premium flex-1">
                Aplicar Filtros
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
                Limpar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          {users.length} pessoas encontradas
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">Online agora</span>
        </div>
      </div>

      {/* Lista de usuários */}
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="card-premium hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-secondary flex items-center justify-center text-white font-bold text-xl shadow-glow">
                  {user.name[0]}
                </div>
                
                {/* Indicadores */}
                {user.online && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
                )}
                {user.premium && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-glow">
                    <span className="text-xs font-bold text-white">👑</span>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}, {user.age}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {user.location} • {user.distance}
                    </p>
                  </div>
                  
                  {user.online && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      Online
                    </span>
                  )}
                </div>

                {/* Interesses */}
                <div className="flex flex-wrap gap-1">
                  {user.interests.map((interest) => (
                    <span key={interest} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 border-white/20 bg-white/10 hover:bg-white/20">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button size="sm" className="flex-1 btn-premium">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button size="sm" variant="outline" className="border-accent/40 bg-accent/10 hover:bg-accent/20">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão para carregar mais */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
          Carregar mais perfis
        </Button>
      </div>
    </div>
  );
};
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin,
  Clock,
  Crown,
  MoreHorizontal,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from '@/hooks/useProfile';

const mockUsers = [
  {
    id: '1',
    nome: 'João Silva',
    idade: 28,
    localizacao: 'São Paulo, BR',
    foto: 'https://source.unsplash.com/random/100x100?sig=1',
    tipo_assinatura: 'premium'
  },
  {
    id: '2',
    nome: 'Maria Oliveira',
    idade: 32,
    localizacao: 'Rio de Janeiro, BR',
    foto: 'https://source.unsplash.com/random/100x100?sig=2',
    tipo_assinatura: 'gratuito'
  },
  {
    id: '3',
    nome: 'Carlos Pereira',
    idade: 24,
    localizacao: 'Belo Horizonte, BR',
    foto: 'https://source.unsplash.com/random/100x100?sig=3',
    tipo_assinatura: 'premium'
  },
];

const mockPublicacoes = [
  {
    id: '101',
    user_id: '1',
    texto: 'Aproveitando o sol da tarde no parque!',
    timestamp: new Date(Date.now() - 600000), // 10 minutos atrás
    likes: 45,
    comentarios: 12,
    compartilhamentos: 5
  },
  {
    id: '102',
    user_id: '2',
    texto: 'Experimentando um novo café na cafeteria da esquina. Delicioso!',
    timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
    likes: 62,
    comentarios: 23,
    compartilhamentos: 8
  },
  {
    id: '103',
    user_id: '3',
    texto: 'Trabalhando remotamente hoje. Adoro a flexibilidade!',
    timestamp: new Date(Date.now() - 86400000), // 1 dia atrás
    likes: 120,
    comentarios: 35,
    compartilhamentos: 15
  },
];

export const HomeTabStatic = () => {
  const { profile } = useProfile();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const isLiked = (postId: string) => likedPosts.has(postId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          {profile?.display_name ? `Olá, ${profile.display_name}!` : 'Olá!'}
        </h2>
        <p className="text-gray-300">Confira as últimas atividades e novidades.</p>
      </div>
      
      {/* Feed */}
      <div className="space-y-6">
        {mockPublicacoes.map((post) => {
          const user = mockUsers.find(u => u.id === post.user_id);
          const isPremium = user?.tipo_assinatura === 'premium';
          
          return (
            <Card key={post.id} className="bg-glass backdrop-blur-md border-primary/20 overflow-hidden">
              <CardContent className="p-4">
                {/* User Info */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="relative">
                    <img 
                      src={user?.foto} 
                      alt={user?.nome} 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    {isPremium && (
                      <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold">{user?.nome}</h3>
                      {isPremium && (
                        <Badge className="bg-yellow-500 text-black border-none">Premium</Badge>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      <MapPin className="inline-block w-4 h-4 mr-1" />
                      {user?.localizacao}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-300 mb-4">{post.texto}</p>

                {/* Post Actions */}
                <div className="flex items-center justify-between text-gray-400">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`gap-1.5 ${isLiked(post.id) ? 'text-red-500' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className="w-5 h-5" />
                      <span>{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comentarios}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Share2 className="w-5 h-5" />
                      <span>{post.compartilhamentos}</span>
                    </Button>
                  </div>
                  <div className="text-sm">
                    <Clock className="inline-block w-4 h-4 mr-1" />
                    {formatDistanceToNow(post.timestamp, { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

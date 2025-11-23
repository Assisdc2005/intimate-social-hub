import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestimonialsManagement } from "@/components/Profile/TestimonialsManagement";
import { TestimonialsSection } from "@/components/Testimonials/TestimonialsSection";
import { useProfile } from "@/hooks/useProfile";

const TestimonialsTab = () => {
  const { profile } = useProfile();

  return (
    <div className="space-y-4">
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Depoimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.user_id && (
            <div className="mb-6">
              <TestimonialsSection profileUserId={profile.user_id} />
            </div>
          )}
          <TestimonialsManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestimonialsTab;

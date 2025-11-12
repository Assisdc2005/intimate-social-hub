import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TestimonialsManagement } from "@/components/Profile/TestimonialsManagement";

const TestimonialsTab = () => {
  return (
    <div className="space-y-4">
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Depoimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <TestimonialsManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default TestimonialsTab;


import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsumableStatus } from "@shared/schema";

// Consumable form schema with validation
const consumableFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Type/Category is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  modelNumber: z.string().optional(),
  location: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

type ConsumableFormValues = z.infer<typeof consumableFormSchema>;

interface ConsumableFormProps {
  onSubmit: (values: ConsumableFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<ConsumableFormValues>;
}

export default function ConsumableForm({ 
  onSubmit, 
  isLoading,
  defaultValues = {
    name: "",
    category: "",
    quantity: 1,
    modelNumber: "",
    location: "",
    manufacturer: "",
    purchaseDate: "",
    purchaseCost: "",
    status: ConsumableStatus.AVAILABLE,
    notes: "",
  }
}: ConsumableFormProps) {
  const form = useForm<ConsumableFormValues>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues,
  });

  const handleSubmit = (values: ConsumableFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. USB Cable, Paper, Toner" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type/Category*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Office Supplies, IT Accessories" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Quantity*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 50" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. HP CF280A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. HP, Canon, Epson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Storage Room A, IT Closet" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 29.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ConsumableStatus.AVAILABLE}>Available</SelectItem>
                    <SelectItem value={ConsumableStatus.IN_USE}>In Use</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes or comments about this consumable" className="h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Consumable"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

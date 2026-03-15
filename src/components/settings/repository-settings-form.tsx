"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { updateRepository } from "@/actions/project-actions";
import type { Repository } from "@/types";
import { Save } from "lucide-react";

const settingsFormSchema = z.object({
  name: z.string().min(1, "リポジトリ名は必須です").max(100),
  description: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface RepositorySettingsFormProps {
  repository: Repository;
}

/** リポジトリ設定フォーム */
export function RepositorySettingsForm({ repository }: RepositorySettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 compat層と@hookform/resolversの型不整合を回避
    resolver: zodResolver(settingsFormSchema as any),
    defaultValues: {
      name: repository.name,
      description: repository.description ?? "",
    },
  });

  function onSubmit(values: SettingsFormValues) {
    startTransition(async () => {
      const result = await updateRepository(repository.id, {
        name: values.name,
        description: values.description,
      });

      if (result.success) {
        toast.success("設定を保存しました");
      } else {
        toast.error(result.error ?? "設定の保存に失敗しました");
      }
    });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>基本設定</CardTitle>
        <p className="text-sm text-muted-foreground">リポジトリの基本情報を編集します。</p>
      </CardHeader>
      <CardContent>
        <Separator className="mb-6" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>リポジトリ名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>リポジトリキー</FormLabel>
              <Input value={repository.key} disabled />
              <FormDescription>
                リポジトリキーは変更できません
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex gap-3">
              <Button type="submit" disabled={isPending} className="rounded-full">
                <Save />
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

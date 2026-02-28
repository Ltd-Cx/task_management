"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { updateProject } from "@/actions/project-actions";
import type { Project } from "@/types";

const settingsFormSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(100),
  description: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface ProjectSettingsFormProps {
  project: Project;
}

/** プロジェクト設定フォーム */
export function ProjectSettingsForm({ project }: ProjectSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<SettingsFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 compat層と@hookform/resolversの型不整合を回避
    resolver: zodResolver(settingsFormSchema as any),
    defaultValues: {
      name: project.name,
      description: project.description ?? "",
    },
  });

  function onSubmit(values: SettingsFormValues) {
    startTransition(async () => {
      await updateProject(project.id, {
        name: values.name,
        description: values.description,
      });
    });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>基本設定</CardTitle>
        <p className="text-sm text-muted-foreground">プロジェクトの基本情報を編集します。</p>
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
                  <FormLabel>プロジェクト名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>プロジェクトキー</FormLabel>
              <Input value={project.key} disabled />
              <FormDescription>
                プロジェクトキーは変更できません
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
              <Button type="button" variant="outline">
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

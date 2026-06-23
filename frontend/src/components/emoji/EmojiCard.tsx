"use client";

import Image from "next/image";
import { useState } from "react";
import { Trash2, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateShort, downloadImage } from "@/lib/utils";
import type { Emoji } from "@/types";

interface EmojiCardProps {
  emoji: Emoji;
  onDelete: (id: string) => void;
}

export function EmojiCard({ emoji, onDelete }: EmojiCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(emoji.id);
    setDeleting(false);
    setShowDetail(false);
  };

  return (
    <>
      <Card
        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
        onClick={() => setShowDetail(true)}
      >
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <Image
            src={emoji.image_url}
            alt={emoji.title}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-xs font-medium bg-black/50 rounded-full px-3 py-1">
              클릭하여 자세히 보기
            </span>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{emoji.title}</p>
            <Badge variant="outline" className="shrink-0 text-xs">
              {emoji.style}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Calendar size={11} className="text-gray-400" />
            <p className="text-xs text-gray-400">{formatDateShort(emoji.created_at)}</p>
          </div>
        </div>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">{emoji.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge variant="outline">{emoji.style}</Badge>
              <span className="text-xs">{formatDateShort(emoji.created_at)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-square rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <Image
              src={emoji.image_url}
              alt={emoji.title}
              fill
              className="object-contain p-6"
              sizes="448px"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="brand"
              className="flex-1"
              onClick={() => downloadImage(emoji.image_url, `${emoji.title}-${emoji.style}.png`)}
            >
              <Download size={16} />
              다운로드
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

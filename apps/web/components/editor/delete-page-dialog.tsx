"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeletePageDialogProps {
  open: boolean;
  pageNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePageDialog({
  open,
  pageNumber,
  onConfirm,
  onCancel,
}: DeletePageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ページを削除</DialogTitle>
          <DialogDescription>
            ページ {pageNumber} を削除してもよろしいですか？
            <br />
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

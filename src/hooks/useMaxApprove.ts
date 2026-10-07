import { create } from 'zustand';

interface MaxApprove {
    maxApprove: boolean;
    setMaxApprove: (loading: boolean) => void;
}

export const useMaxApprove = create<MaxApprove>((set) => ({
    maxApprove: false,
    setMaxApprove: (loading) => set({ maxApprove: loading }),
}));
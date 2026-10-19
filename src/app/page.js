import RotatingBoxScene from '@/components/LaptopModel.jsx';

export default function Home() {
  return (
    <main
      className="w-full bg-[#020617] text-white"
      style={{ height: '520vh' }}
    >
      {/* 3D Laptop experience — fixed to the viewport, driven by page scroll */}
      <RotatingBoxScene />

      {/* Spacer content gives the page enough scroll height to drive the full
          laptop opening animation (scroll progress 0 -> 1). */}
      <div style={{ height: '520vh', pointerEvents: 'none' }} />
    </main>
  );
}

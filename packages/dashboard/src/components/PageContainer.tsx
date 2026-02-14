interface PageContainerProps {
  children: React.ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
      {children}
    </div>
  );
}

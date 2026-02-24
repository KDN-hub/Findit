'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface SwipeableLayoutProps {
    children: ReactNode;
}

// Define the order of pages for swipe navigation
const PAGE_ORDER = ['/dashboard', '/messages', '/items', '/profile'];

export function SwipeableLayout({ children }: SwipeableLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const x = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);

    // Determine current page index
    const currentIndex = PAGE_ORDER.findIndex((path) => pathname.startsWith(path));

    // Determine slide direction for animations
    const getDirection = () => {
        // This will be set based on navigation direction
        return 1; // Default
    };

    // Handle swipe gestures with very low thresholds
    const handleDragEnd = (_event: any, info: PanInfo) => {
        setIsDragging(false);

        // Instagram-like thresholds - very sensitive and responsive
        const SWIPE_DISTANCE_THRESHOLD = 25; // Very low - any intentional swipe triggers
        const SWIPE_VELOCITY_THRESHOLD = 200; // Low velocity needed

        const swipeDistance = Math.abs(info.offset.x);
        const swipeVelocity = Math.abs(info.velocity.x);

        // Determine if this was an intentional swipe
        const isIntentionalSwipe = swipeDistance > SWIPE_DISTANCE_THRESHOLD || swipeVelocity > SWIPE_VELOCITY_THRESHOLD;

        if (!isIntentionalSwipe || currentIndex === -1) return;

        // Swipe left = go to next page
        if (info.offset.x < -SWIPE_DISTANCE_THRESHOLD && currentIndex < PAGE_ORDER.length - 1) {
            const nextPage = PAGE_ORDER[currentIndex + 1];
            router.push(nextPage);
        }
        // Swipe right = go to previous page
        else if (info.offset.x > SWIPE_DISTANCE_THRESHOLD && currentIndex > 0) {
            const prevPage = PAGE_ORDER[currentIndex - 1];
            router.push(prevPage);
        }
    };

    // Only enable swipe on main pages
    const isSwipeEnabled = currentIndex !== -1;

    // Instagram-style slide variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? '-100%' : '100%',
            opacity: 0,
        }),
    };

    return (
        <motion.div
            drag={isSwipeEnabled ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7} // High elasticity for smooth, stretchy feel
            dragMomentum={true}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ x }}
            transition={{
                type: 'spring',
                stiffness: 400, // Higher stiffness for snappier response
                damping: 35,
                mass: 0.5, // Lower mass for lighter feel
                velocity: 2,
            }}
            className="h-full w-full"
            whileTap={{ cursor: 'grabbing' }}
        >
            <AnimatePresence mode="wait" custom={getDirection()}>
                <motion.div
                    key={pathname}
                    custom={getDirection()}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 40,
                        mass: 0.4,
                    }}
                    className="h-full w-full"
                    style={{
                        touchAction: 'pan-y',
                    }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

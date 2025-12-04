import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    Factory,
    PackagePlus,
    Ship,
    PackageSearch,
    Menu,
    X
} from "lucide-react";

const navItems = [
    { 
        name: "Dashboard",
        icon: <LayoutDashboard size={18} />, 
        path: "/master", 
        type: "link" 
    },

    { 
        name: "Produksi",
        icon: <Factory size={18} />,
        type: "dropdown",
        children: [
            { name: "Produksi Pabrik", path: "/produksi/pabrik", group: "Pabrik" },
            { name: "Input Pabrik", path: "/input/pabrik", group: "Pabrik" },
            { name: "Produksi Pelabuhan", path: "/produksi/bks", group: "BKS" },
            { name: "Input Pelabuhan", path: "/input/bks", group: "BKS" }
        ]
    },

    { 
        name: "Penjumboan",
        icon: <PackagePlus size={18} />,
        type: "dropdown",
        children: [
            { name: "Dashboard Polysling", path: "/penjumboan", group: "Penjumboan" },
            { name: "Input Penjumboan", path: "/input/penjumboan", group: "Penjumboan" }
        ]
    },

    { 
        name: "Pemuatan",
        icon: <Ship size={18} />,
        type: "dropdown",
        children: [
            { name: "Dashboard Pemuatan", path: "/pemuatan", group: "Pemuatan" },
            { name: "Input Pemuatan", path: "/input/pemuatan", group: "Pemuatan" }
        ]
    },

    { 
        name: "Packing Plant",
        icon: <PackageSearch size={18} />,
        type: "dropdown",
        children: [
            { name: "Dashboard Packing Plant", path: "/packing-plant/dashboard", group: "Packing Plant" },
            { name: "Input Packing Plant", path: "/input/packing-plant", group: "Packing Plant" }
        ]
    }
];

export default function Sidebar() {
    const [openMenu, setOpenMenu] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // State untuk toggle mobile
    const location = useLocation();
    const { user } = useAuth();

    const canShowInput = (groupName) => {
        if (!user) return false;
        if (["superuser", "admin"].includes(user.role)) return true;
        if (user.role === "entry_admin") {
            const allowed = user.allowed_groups?.split(',').map(g => g.trim());
            return allowed?.includes(groupName);
        }
        return false;
    };

    const toggleMenu = (name) => setOpenMenu(openMenu === name ? null : name);
    const activeParent = (item) => item.children?.some(c => location.pathname.startsWith(c.path));

    const handleNavLinkClick = (name) => {
        if (window.innerWidth < 768) { 
            setIsOpen(false);
        }
    };


    return (
        <>
            {/* Mobile Menu Button - Fixed on small screens */}
            <button 
                className="fixed top-4 left-4 z-[60] md:hidden p-2 bg-blue-600 text-white rounded-full shadow-xl transition hover:bg-blue-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop - Only visible on mobile when open */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity" 
                    onClick={() => setIsOpen(false)} 
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                w-64 bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-xl flex flex-col 
                fixed inset-y-0 left-0 z-50 h-screen 
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:static md:translate-x-0 md:flex
            `}>
                
                {/* Header */}
                <div className="px-6 py-5 border-b bg-white/80 backdrop-blur-xl shadow-sm">
                    <h1 className="text-xl font-bold text-blue-700">Navigation Panel</h1>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto"> {/* Scroll diterapkan di nav */}

                    {navItems.map(item => {
                        const active = activeParent(item);

                        return (
                            <div key={item.name}>
                                
                                {/* === DROPDOWN ITEM === */}
                                {item.type === "dropdown" ? (
                                    <>
                                        <button 
                                            onClick={() => toggleMenu(item.name)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                                     ${active ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-100 text-gray-700"}`}>
                                            <span className="text-lg">{item.icon}</span>
                                            <span>{item.name}</span>
                                            <span className="ml-auto opacity-70">{openMenu === item.name ? "▲" : "▼"}</span>
                                        </button>

                                        {/* Dropdown content */}
                                        {openMenu === item.name && (
                                            <div className="pl-8 py-2 space-y-1">
                                                {item.children?.map(sub => {
                                                    const isInput = sub.path.includes("/input");
                                                    if (isInput && !canShowInput(sub.group)) return null;

                                                    return (
                                                        <NavLink
                                                            key={sub.name}
                                                            to={sub.path}
                                                            onClick={() => handleNavLinkClick(sub.name)}
                                                            className={({ isActive }) =>
                                                                `block px-3 py-2 rounded-lg text-sm transition 
                                                                ${isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`
                                                            }
                                                        >
                                                            • {sub.name}
                                                        </NavLink>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* === SINGLE ITEM === */
                                    <NavLink
                                        to={item.path}
                                        end
                                        onClick={() => handleNavLinkClick(item.name)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                                            ${isActive ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-100 text-gray-700"}`
                                        }
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        {item.name}
                                    </NavLink>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
const sampleUsers = [];

const sampleEvents = [
    {
        title: 'Chennai Music Festival 2026',
        description: 'Experience an enchanting night of classical fusion and modern indie music featuring top artists from across South India. Food stalls, light shows, and vibrant acoustics await!',
        category: 'Music',
        location: 'Chennai',
        venue: 'YMCA Grounds, Royapettah',
        date: new Date('2026-08-25T18:00:00Z'),
        time: '06:00 PM',
        ticketPrice: 1000,
        totalTickets: 500,
        availableTickets: 500,
        organizer: 'Sunbeat Live Events',
        status: 'Upcoming'
    },
    {
        title: 'Tech Innovators Summit 2026',
        description: 'India\'s premier technology conference focusing on Generative AI, Cloud Native Systems, Web3, and Tech Entrepreneurship. Network with industry leaders and investors.',
        category: 'Technology',
        location: 'Bengaluru',
        venue: 'KTPO Exhibition Center, Whitefield',
        date: new Date('2026-09-10T09:30:00Z'),
        time: '09:30 AM',
        ticketPrice: 1499,
        totalTickets: 300,
        availableTickets: 300,
        organizer: 'TechSphere Global',
        status: 'Upcoming'
    },
    {
        title: 'Stand-Up Comedy Special with Zakir & Friends',
        description: 'Get ready for a night of non-stop laughter and relatable observational comedy with India\'s favorite stand-up comedians!',
        category: 'Comedy',
        location: 'Hyderabad',
        venue: 'Shilpakala Vedika, Hitech City',
        date: new Date('2026-09-02T19:30:00Z'),
        time: '07:30 PM',
        ticketPrice: 799,
        totalTickets: 400,
        availableTickets: 400,
        organizer: 'Laugh Factory India',
        status: 'Upcoming'
    }
];

module.exports = {
    sampleUsers,
    sampleEvents
};

import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../convex/_generated/api';

export function useLikeSeedMutation() {
  const mutationFn = useConvexMutation(api.likes.toggleLikeSeed).withOptimisticUpdate(
    (localStore, args) => {
      const like = localStore.getQuery(api.likes.checkUserLikedSeed, {
        userId: args.userId,
        seed: args.seed,
      });
      if (like !== null) return;

      localStore.setQuery(
        api.likes.checkUserLikedSeed,
        { userId: args.userId, seed: args.seed },
        true,
      );
    },
  );
  return useMutation({
    mutationFn,
    // This ensures mutations persist when offline and retry when back online
    retry: 3,
    retryDelay: 1000,
    networkMode: 'offlineFirst',
  });
}

// export function useCreateColumnMutation() {
//   const mutationFn = useConvexMutation(api.board.createColumn).withOptimisticUpdate(
//     (localStore, args) => {
//       const board = localStore.getQuery(api.board.getBoard, { id: args.boardId });
//       if (!board) return;

//       const randomId = Math.random() + '';

//       const newBoard = {
//         ...board,
//         columns: [
//           ...board.columns,
//           {
//             ...args,
//             order: board.columns.length + 1,
//             id: randomId,
//             items: [],
//           },
//         ],
//       };

//       localStore.setQuery(api.board.getBoard, { id: board.id }, newBoard);
//     },
//   );

//   return useMutation({
//     mutationFn,
//     // This ensures mutations persist when offline and retry when back online
//     retry: 3,
//     retryDelay: 1000,
//     networkMode: 'offlineFirst',
//   });
// }
